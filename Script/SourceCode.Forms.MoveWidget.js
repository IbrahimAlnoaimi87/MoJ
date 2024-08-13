//Purpose: A draggable Move widget appearing top-left of a control
//        for the selected control on the view/form canvas.
//Author: Lewis Garmston

var MoveWidget = function (options)
{
    this.initialize(options);
};

var _MoveWidgetPrototype =
{
    _selectedControl: null,
    element: null, //the move widget element itself
    button: null,
    scrollWrapper: null,
    controlElement: null,  //the control element the move control is moving (typically a table)
    shouldShow: false,
    _isDragging: false, // [889297] Flag used to keep status if the move widget is dragging. Flag will be used to prevent mouseUp event from executing after drag event for move widget is finished

    initialize: function (options)
    {
        this.options = $.extend({}, this.options, options);

        //get notified when a new control is selected.
        this.controlSelectedDelegate = this._controlSelected.bind(this);
        this.designerChangedDelegate = this._designerChanged.bind(this);
        this.controlChangedSizeDelegate = this._controlChangedSize.bind(this);
        this.controlMovedDelegate = this._controlMoved.bind(this);
        this.hideDelegate = this._hide.bind(this);
        this.layoutChangedDelegate = this._layoutChanged.bind(this);
        this.scrollEndDelegate = this.scrollEnd.bind(this);

        SourceCode.Forms.Designers.Common.registerForEvent("LayoutChanged", this.layoutChangedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ControlMoved", this.controlMovedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ControlSizeChanged", this.controlChangedSizeDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("DesignerChanged", this.designerChangedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ControlSelected", this.controlSelectedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ControlDragStarted", this.hideDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ControlDragStopped", this.controlMovedDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ScrollStarted", this.hideDelegate);
        SourceCode.Forms.Designers.Common.registerForEvent("ScrollEnded", this.scrollEndDelegate);   
    },

    destroy: function ()
    {
        this._destroy();
    },

    isDragging: function ()
    {
        return this._isDragging;
    },

    setDragging: function (isDragVal)
    {
        this._isDragging = isDragVal;
    },

    _shouldShowFor: function (controlElement)
    {
        if (checkExists(controlElement) && controlElement.length === 0)
        {
            return false;
        }

        var isViewRootTable = controlElement.parent().attr("id") === "bodySection"; //the control element is a canvas table
        var isToolbarTable = controlElement.attr("controltype") === "ToolbarTable"; //the control element is a toolbar table

        return !isViewRootTable && !isToolbarTable;
    },

    _controlSelected: function (event, controlObjectModel)
    {
        this._ensureRendered();

        if (controlObjectModel.id === this._lastControlId)
        {
            return;
        }

        var jqControlElement = $();

        switch (controlObjectModel.controlType)
        {
            case 'table':
            case 'cell':
            case 'column':
                var jqTable = SourceCode.Forms.Designers.Common.getEditorTableFromSelectedObject(controlObjectModel.element);
                jqControlElement = SourceCode.Forms.Designers.Common.Context.getControlWrapper(jqTable);
                break;
        }

        this.button.toggleClass("selected", controlObjectModel.controlType==='table');

        this.shouldShow = this._shouldShowFor(jqControlElement);
        if (this.shouldShow)
        {
            this._selectedControl = controlObjectModel;
            this._lastControlId = controlObjectModel.id;
            this.visualElement = jqTable;
            this.controlElement = jqControlElement;
            this._reposition();
        }
        else
        {
            this._lastControlId = controlObjectModel.id;
            this._hide();
        }
    },

    _controlChangedSize: function (event, controlObjectModel)
    {
        if (!this.shouldShow)
        {
            //[897310] If selected control doesn't use move widget, just hide it.
            this._hide();
            return;
        }

        if (checkExists(controlObjectModel) && checkExists(this.controlElement) && controlObjectModel.id === this.controlElement.attr("id"))
        {
            this._reposition();
        }
    },

    _controlMoved: function (event)
    {
        if (!this.shouldShow)
        {
            //[894138] If selected control doesn't use move widget, just hide it.
            this._hide();
            return;
        }

        //Note: After a control is moved simply refresh the position of the move widget on the selected control element.
        //The control been moved may not be the currently selected control thus we don't need to check if the control been moved is the same as the selected control element of the move widget.
        this._reposition();
    },

    scrollEnd: function ()
    {
        this._reposition();

        if (!this.shouldShow || this.isDragging()) this._hide();
    },

    _reposition: function ()
    {
        this._ensureRendered();

        var control = $(this.controlElement);
        var moveWidget = this.element;

        moveWidget.data("control-ID", control.attr('id'));
           
        if (!checkExists(control) || control.length === 0) return;

        var canvasScrollWrapper = this.scrollWrapper;
        var position = SourceCode.Forms.CanvasWidgetHelper.getAccurateLocation(this.visualElement, canvasScrollWrapper);

        this.button.toggleClass("selected", (this.controlElement.hasClass("selectedobject") || this.controlElement.hasClass("selected")));

        this._show();

        moveWidget.css({ top: position.top, left: position.left });
    },
    
    handleMoveWidgetClick: function ()
    {
        SourceCode.Forms.Designers.Common.Context.selectControl(this.controlElement.attr("id"));
        return false;
    },

    _show: function ()
    {
        //stop all animation queued for moveWidget element
        this.element.stop(true, true);
        this.element.removeClass("hide");
    },

    _hide: function ()
    {
        if (!checkExists(this.element))
        {
            return;
        }

        //stop all animation queued for moveWidget element
        this.element.stop(true, true);
        this.element.addClass("hide");
        this.button.removeClass("selected");
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
        return (checkExists(this.element) && this.element.length > 0);
    },

    _TEMPLATE: "<div class=\"moveWidget hide\" id=\"moveWidget\"><div class=\"widget-button draggable\" id=\"widget-button\"></div></div>",

    _render: function ()
    {
        //If this.element exists remove it from the DOM and then later append it to this.scrollWrapper
        this.element = checkExists(this.element) ? this.element.remove() : $(this._TEMPLATE);

        //Create and add the MoveWidget to the designer scrollwrapper (applicable to both view and form designer)
        var scrollWrapper = SourceCode.Forms.Designers.Common.getDesignerCanvasScrollWrapper();
        this.scrollWrapper = $(scrollWrapper);
        this.scrollWrapper.append(this.element);

        this.button = this.element.find("#widget-button");

        //Link up the button to make it draggable and clickable
        SourceCode.Forms.Designers.Common.Context.makeDraggableElement(this.button);
        this.button.on("click", this.handleMoveWidgetClick.bind(this));
    },

    getAssociatedControl: function ()
    {
        return this.controlElement;
    },

    _layoutChanged: function ()
    {
        this._reposition();

        if (!this.shouldShow || this.isDragging()) this._hide();
    },

    _designerChanged: function ()
    {
        if (this._isRendered()) this.element.remove();
    },

    _destroy: function ()
    {
        if (checkExists(this.element))
        {
            this.element.remove(); //remove() will also unbind previously-attached event handler from the element.
        }
        
        SourceCode.Forms.Designers.Common.deregisterForEvent("LayoutChanged", this.layoutChangedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ControlMoved", this.controlMovedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ControlSizeChanged", this.controlChangedSizeDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("DesignerChanged", this.designerChangedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ControlSelected", this.controlSelectedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ControlDragStarted", this.hideDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ControlDragStopped", this.controlMovedDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ScrollStarted", this.hideDelegate);
        SourceCode.Forms.Designers.Common.deregisterForEvent("ScrollEnded", this.scrollEndDelegate);  
    }

};

$.extend(MoveWidget.prototype, _MoveWidgetPrototype);
