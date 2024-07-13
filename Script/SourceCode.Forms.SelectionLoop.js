//Purpose: A simple class that shows a blue border around the
//         selected control on the view/form canvas.
//Author: Lewis Garmston

var SelectionLoop = function (options)
{
    this.initialize(options);
};

var _SelectionLoopPrototype =
{
    options:
    {
        scrollWrapperObj: null,
    },

    scrollWrapper: null,
    element: $(),
    _selectedControlObjectModel: null,

    initialize: function (options)
    {
        this.options = $.extend({}, this.options, options);

        //get notified when a new control is selected.
        this.controlSelectedDelegate = this._controlSelected.bind(this);

        this.controlVisuallyChangedDelegate = this._controlVisuallyChanged.bind(this);
        this.controlStyleOrSizeChangedDelegate = this._controlStyleOrSizeChanged.bind(this);
        this.controlWasRepositionedDelegate = this._controlRepositioned.bind(this);
        this.layoutChangedDelegate = this._controlRepositioned.bind(this);

        this.hideSelectionLoopDelegate = this._hideSelectionLoop.bind(this);
        this.designerChangedDelegate = this._designerChanged.bind(this);
        this.canvasClearedDelegate = this._canvasCleared.bind(this);

        this.controlDragStartedDelegate = this._controlDragStarted.bind(this);
        this.controlDragStoppedDelegate = this._controlDragStopped.bind(this);
        this.scrollEndDelegate = this.scrollEnd.bind(this);

        SourceCode.Forms.Designers.Common.registerForEvent("DesignerChanged", this.designerChangedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("CanvasCleared", this.canvasClearedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("LayoutChanged", this.layoutChangedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ControlSelected", this.controlSelectedDelegate);

        SourceCode.Forms.Designers.Common.registerForEvent("ControlStyleChanged", this.controlStyleOrSizeChangedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ControlSizeChanged", this.controlStyleOrSizeChangedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ControlMoved", this.controlVisuallyChangedDelegate);

        //After "ControlDragStarted" is fired, the control consider in dragging state until it has been dropped e.g. when ControlMoved or ControlSelected events are fired.
        //If a control is in dragging state, the SelectionLoop should suppress the LayoutChanged event and SelectionLoop should be hidden.
        SourceCode.Forms.Designers.Common.registerForEvent("ControlDragStarted", this.controlDragStartedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ControlDragStopped", this.controlDragStoppedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ScrollStarted", this.hideSelectionLoopDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ScrollEnded", this.scrollEndDelegate); 
        
        SourceCode.Forms.Designers.Common.registerForEvent("CellMerged", this.controlVisuallyChangedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("RowsAdded", this.controlWasRepositionedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("RowsRemoved", this.controlWasRepositionedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ColumnsAdded", this.controlWasRepositionedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ColumnsRemoved", this.controlWasRepositionedDelegate);
    },

    _designerChanged: function ()
    {
        if (checkExists(this.element))
        {
            this.element.remove();

            this.element = null;
        }
    },

    _canvasCleared: function ()
    {
        if (checkExists(this.element))
        {
            this.element.remove();

            this.element = null;
        }
    },

    _controlNeedsSelectionLoop: function (controlObjectModel)
    {
        return (
            controlObjectModel.controlType !== 'column' &&
            //view designer empty screen
            !(controlObjectModel.controlType === 'view' && controlObjectModel.element.parents(".empty").length > 0) &&
            this._controlElementNeedsSelectionLoop(controlObjectModel.element)
        );
    },

    _controlElementNeedsSelectionLoop: function (controlElement)
    {
        return (
            checkExists(controlElement) &&
            controlElement.length > 0 &&
            !(controlElement.is("col")) &&
            //form designer outer selection - needs fixing in Forms.Layout._selectItem()
            !(controlElement.is("#CanvasPane") || this.isFormTab(controlElement)) &&
            //no header cells in list view designer
            !(controlElement.is(".header"))
        );
    },

    isFormTab: function (controlElement)
    {
        return (controlElement.is("#pgTabControl") || controlElement.is(".tab-content-wrapper") || controlElement.is(".tab-panel"));
    },

    _getRemoveDimensionsForControl: function (selectedElement, controlObjectModel)
    {
        if (controlObjectModel.controlType === 'cell')
        {
            return {
                top: parseInt(selectedElement.css("border-top-width")),
                left: parseInt(selectedElement.css("border-left-width")),
                bottom: parseInt(selectedElement.css("border-bottom-width")),
                right: parseInt(selectedElement.css("border-right-width"))
            };
        }
        else
        {
            return {
                top: 0,
                left: 0,
                bottom: 0,
                right: 0
            };
        }
    },

    _controlDragStarted: function ()
    {
        this._hideSelectionLoop();
    },

    _controlDragStopped: function ()
    {
        if (checkExists(this._selectedControlObjectModel))
        {
            this._moveLoopToControl(this._selectedControlObjectModel, false);
        }
    },

    scrollEnd: function ()
    {
        if (checkExists(this._selectedControlObjectModel))
        {
            this._moveLoopToControl(this._selectedControlObjectModel, false);
        }
    },

    _hideSelectionLoop: function ()
    {
        if (checkExists(this.element)) this.element.removeClass("show firsttime");
    },

    _controlSelected: function (event, controlObjectModel)
    {
        this._lastSelectedId = this._getControlIdFromObjectModel(controlObjectModel);

        this._selectedControlObjectModel = controlObjectModel;
        this._moveLoopToControl(controlObjectModel, true);

        this._updateMergeHandles();
    },

    _getControlIdFromObjectModel: function(controlObjectModel)
    {
        var controlId = controlObjectModel.id;
        if (!checkExists(controlId))
        {
            if (controlObjectModel.element.is(".tab-content-wrapper"))
            {
                //[888426] This is a special case where in the Form designer, the selected eleemt is a tab-wrapper but the actual control is the tab-panel. (tab-wrapper doesnt have an id.)
                controlId = controlObjectModel.element.find(">.tab-panel").eq(0).attr("id");
            }
        }

        return controlId;
    },

    _getSelectedElementFromObjectModel: function (controlObjectModel)
    {
        var el = controlObjectModel.visualElement;

        if (!checkExists(el) || el.length === 0)
        {
            el = controlObjectModel.resizeWrapper;
        }

        if (!checkExists(el) || el.length === 0)
        {
            el = controlObjectModel.element;
        }
        return el;
    },

    _updateMergeHandles: function ()
    {
        //Uncomment this out to allow merge handles.
        //var isCell = SourceCode.Forms.Designers.Common.isTableControlCell(this._selectedControlObjectModel.element);

        //this.element.toggleClass("cellselected", isCell);

        //if (isCell)
        //{
        //    var helper = SourceCode.Forms.TableHelper;
        //    var jqCell = this._selectedControlObjectModel.element;
        //    var jqTable = helper.getTableFromCell(jqCell);
        //    var tableArray = helper.getTableArray(jqTable);
        //    this._btnMergeLeft.toggleClass("show", helper.canMergeLeft(tableArray, jqCell));
        //    this._btnMergeRight.toggleClass("show", helper.canMergeRight(tableArray, jqCell));
        //    this._btnMergeUp.toggleClass("show", helper.canMergeUp(tableArray, jqCell));
        //    this._btnMergeDown.toggleClass("show", helper.canMergeDown(tableArray, jqCell));
        //}
    },

    _controlStyleOrSizeChanged: function (event, controlObjectModel)
    {
        if (checkExists(this._selectedControlObjectModel) && controlObjectModel.id === this._selectedControlObjectModel.id)
        {
            this._moveLoopToControl(this._selectedControlObjectModel, false);
            this._updateMergeHandles();
        }
    },

    _controlVisuallyChanged: function (event, controlObjectModel)
    {
        if (checkExists(this._selectedControlObjectModel))
        {
            this._moveLoopToControl(this._selectedControlObjectModel, true);
            this._updateMergeHandles();
        }
    },

    //something else on the canvas moved the current selected element (item inserted above it etc)
    _controlRepositioned: function ()
    {
        if (!checkExists(this.element) || !this.element.hasClass("show"))
        {
            //When a control is in dragging state, no need to update the selection loop
            return;
        }

        if (this._lastSelectedId !== null && checkExists(this.scrollWrapper))
        {
            this._moveLoopToControl(this._selectedControlObjectModel, false);
        }
    },

    //main start point for this widget to position itself.
    //{id, controlType, layoutType, resizeWrapper, element}
    _moveLoopToControl: function (controlObjectModel, animate)
    {
        var selectedElement = this._getSelectedElementFromObjectModel(controlObjectModel);

        if (this._controlNeedsSelectionLoop(controlObjectModel))
        {
            this._moveLoop(selectedElement, animate);
        }
        else
        {
            this._hideSelectionLoop();
        }

    },

    _moveLoop: function (selectedElement, animate)
    {
        if (checkExists(selectedElement) && selectedElement.length > 0)
        {
            this._ensureRendered();
            var selectionLoop = this.element;
            var wasShowing = selectionLoop.hasClass("show");            

            selectionLoop.css("transition-duration", animate ? "" : "0s");

            if (!wasShowing)
            {
                selectionLoop.css("transition-duration", "0s");
                selectionLoop.addClass("firsttime");
            }
            else
            {
                selectionLoop.removeClass("firsttime");
            }

            var removeDimensions = this._getRemoveDimensionsForControl(selectedElement, this._selectedControlObjectModel);

            //get position of selected control
            var position = SourceCode.Forms.CanvasWidgetHelper.getAccurateLocation(selectedElement, this.scrollWrapper);
           
            position = {
                top: position.top + removeDimensions.top ,
                left: position.left + removeDimensions.left
            };
            var size = {
                width: selectedElement.outerWidth() - removeDimensions.right - removeDimensions.left,
                height: selectedElement.outerHeight() - removeDimensions.bottom - removeDimensions.top
            };

            //move the selection loop widget
            selectionLoop.css({
                "left": position.left,
                "top": position.top,
                "width": size.width,
                "height": size.height
            });


            if (!wasShowing)
            {
                //force DOM refresh
                this._forceRedraw(selectionLoop[0]);
                setTimeout(function ()
                {
                    selectionLoop.css("transition-duration", animate ? "" : "0s");
                    selectionLoop.addClass("show");
                }, 10);
                
            }
        }
        else
        {
            this._hideSelectionLoop();
        }
    },

    _forceRedraw : function (element)
    {
        var disp = element.style.display;
        element.style.display = 'none';
        var trick = element.offsetHeight;
        element.style.display = disp;
    },

    _ensureRendered: function ()
    {
        if (!this._isRendered())
        {
            this._render();
        }
    },

    _isRendered: function ()
    {
        var isRendered = false;

        if (checkExists(this.element) && this.element.length > 0)
        {
            var container = this.element.parent();

            //Ensure the selection loop is rendered under the scrollWrapper
            if (checkExists(container) && container.length > 0 && container[0] === this.scrollWrapper[0])
            {
                isRendered = true;
            }
            else
            {
                //If the selection loop is not rendered under the scrollwrapper, something is wrong thus remove the SelectionLoop from the document to re-render it again
                this.element.remove();
            }
        }

        return isRendered;
    },

    _TEMPLATE: "<div class='selection-loop'> \
                <div class='inner'></div> \
                <div class='mergehandle mergeleft'></div> \
                <div class='mergehandle mergeright'></div> \
                <div class='mergehandle mergetop'></div> \
                <div class='mergehandle mergebottom'></div> \
            </div>",

    _render: function ()
    {
        //agnostic to view or form designer
        var scrollWrapper = SourceCode.Forms.Designers.Common.getDesignerCanvasScrollWrapper();
        this.scrollWrapper = $(scrollWrapper);
        var element = $(this._TEMPLATE);
        this.scrollWrapper.append(element);
        this.element = element;

        this._btnMergeRight = this.element.find(".mergeright");
        this._btnMergeLeft = this.element.find(".mergeleft");
        this._btnMergeDown = this.element.find(".mergebottom");
        this._btnMergeUp = this.element.find(".mergetop");

        this._btnMergeRight.on("click", this._mergeRight.bind(this));
        this._btnMergeLeft.on("click", this._mergeLeft.bind(this));
        this._btnMergeDown.on("click", this._mergeDown.bind(this));
        this._btnMergeUp.on("click", this._mergeUp.bind(this));
    },


    _mergeRight: function (e)
    {
        var designer = SourceCode.Forms.Designers.Common.getDesigner();
        var tableBehavior = SourceCode.Forms.Controls.Web.TableBehavior.prototype;
        tableBehavior.mergeRight(this._selectedControlObjectModel.element, designer);
        return false;
    },

    _mergeLeft: function (e)
    {
        var designer = SourceCode.Forms.Designers.Common.getDesigner();
        var tableBehavior = SourceCode.Forms.Controls.Web.TableBehavior.prototype;
        tableBehavior.mergeLeft(this._selectedControlObjectModel.element, designer);
        return false;
    },

    _mergeDown: function (e)
    {
        var designer = SourceCode.Forms.Designers.Common.getDesigner();
        var tableBehavior = SourceCode.Forms.Controls.Web.TableBehavior.prototype;
        tableBehavior.MergeDown(this._selectedControlObjectModel.element, designer);
        return false;
    },

    _mergeUp: function (e)
    {
        var designer = SourceCode.Forms.Designers.Common.getDesigner();
        var tableBehavior = SourceCode.Forms.Controls.Web.TableBehavior.prototype;
        tableBehavior.MergeUp(this._selectedControlObjectModel.element, designer);
        return false;
    },

    destroy: function ()
    {
        if (checkExists(this.element))
        {
            this.element.remove(); //remove() will also unbind previously-attached event handler from the element.
        }

        this._selectedControlObjectModel = null;
        this.scrollWrapper = null;

        SourceCode.Forms.Designers.Common.deregisterForEvent("DesignerChanged", this.designerChangedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("CanvasCleared", this.canvasClearedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("LayoutChanged", this.layoutChangedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ControlSelected", this.controlSelectedDelegate);

        SourceCode.Forms.Designers.Common.deregisterForEvent("ControlStyleChanged", this.controlStyleOrSizeChangedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ControlSizeChanged", this.controlStyleOrSizeChangedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ControlMoved", this.controlVisuallyChangedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ControlDragStarted", this.controlDragStartedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ControlDragStopped", this.controlDragStoppedDelegate);  
        SourceCode.Forms.Designers.Common.deregisterForEvent("ScrollStarted", this.hideSelectionLoopDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ScrollEnded", this.scrollEndDelegate); 

        SourceCode.Forms.Designers.Common.deregisterForEvent("CellMerged", this.controlVisuallyChangedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("RowAdded", this.controlWasRepositionedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("RowRemoved", this.controlWasRepositionedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ColumnAdded", this.controlWasRepositionedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ColumnRemoved", this.controlWasRepositionedDelegate);
    }
};

$.extend(SelectionLoop.prototype, _SelectionLoopPrototype);

