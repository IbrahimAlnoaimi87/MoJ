//Purpose: A simple class that shows error badges for the controls on the view/form canvas.
//Author: Jack Tseng

var ControlALMBadgeManager = function (options)
{
    this.initialize(options);
};

var _ControlALMBadgeManagerPrototype =
    {
        _TEMPLATE: "<div class='canvas-widget-ui canvas-badge'></div>",

        initialize: function (options)
        {
            this.badgeClasses =
                {
                    error: "error",
                    warning: "warning"
                };

            this.templateElement = $(this._TEMPLATE);
            this.renderedConatiner = this._getCanvas().find("#pgOuterPanel, .canvas-layout-table").first();

            this.options = $.extend({}, this.options, options);

            this.controlsBadgedwithAdornment = {};

            this.removeBadgeToControlDelegate = this.removeBadgeFromControl.bind(this);
            this.removeAllBadgesDelegate = this._removeAllBadges.bind(this);

            this.controlSelectedDelegate = this._controlSelected.bind(this);

            this.controlMovedDelegate = this._controlMoved.bind(this);
            this.controlStyleOrSizeChangedDelegate = this._controlStyleOrSizeChanged.bind(this);
            this.layoutChangedDelegate = this._repositionBadges.bind(this);

            this.designerChangedDelegate = this._designerChanged.bind(this);
            this.canvasClearedDelegate = this._canvasCleared.bind(this);

            this.controlDragStartedDelegate = this._controlDragStarted.bind(this);
            this.controlDragStoppedDelegate = this._controlDragStopped.bind(this);

            SourceCode.Forms.Designers.Common.registerForEvent("DesignerChanged", this.designerChangedDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("CanvasCleared", this.canvasClearedDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("CanvasLoaded", this.layoutChangedDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("CanvasDisplayed", this.layoutChangedDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("LayoutChanged", this.layoutChangedDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("CellAlignmentChanged", this.layoutChangedDelegate);

            SourceCode.Forms.Designers.Common.registerForEvent("RemoveBadgeToControl", this.removeBadgeToControlDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("RemoveAllBadges", this.removeAllBadgesDelegate);

            SourceCode.Forms.Designers.Common.registerForEvent("ControlSelected", this.controlSelectedDelegate);

            SourceCode.Forms.Designers.Common.registerForEvent("ControlStyleChanged", this.controlStyleOrSizeChangedDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("ControlSizeChanged", this.controlStyleOrSizeChangedDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("ControlMoved", this.controlMovedDelegate);

            SourceCode.Forms.Designers.Common.registerForEvent("ControlDragStarted", this.controlDragStartedDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("ControlDragStopped", this.controlDragStoppedDelegate);

            SourceCode.Forms.Designers.Common.registerForEvent("CellMerged", this.layoutChangedDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("RowsAdded", this.layoutChangedDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("RowsRemoved", this.layoutChangedDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("ColumnsAdded", this.layoutChangedDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("ColumnsRemoved", this.layoutChangedDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("ColumnWidthChanged", this.layoutChangedDelegate);
        },

        _designerChanged: function ()
        {
            $(".canvas-badge").remove(); //remove() will also unbind previously-attached event handler from the element.
            this.controlsBadgedwithAdornment = {};
        },

        _canvasCleared: function ()
        {
            $(".canvas-badge").remove(); //remove() will also unbind previously-attached event handler from the element.
            this.controlsBadgedwithAdornment = {};
        },

        _controlDragStarted: function (e, data)
        {
            this._repositionBadges();

            var elementBeenDragged = data.element;

            if (checkExists(elementBeenDragged))
            {
                var dragObjId = $(elementBeenDragged).attr("id");

                this._lastDraggedId = dragObjId;

                this._hideBadge(this._lastDraggedId);

                var isMoveWidget = SourceCode.Forms.Designers.Common.isMoveWidget(elementBeenDragged);

                if (isMoveWidget)
                {
                    dragObjId = $(elementBeenDragged).closest(".moveWidget").data("controlID");

                    var controlsWithBadge = $("#" + dragObjId).find(".error, .warning");

                    for (var i = 0; i < controlsWithBadge.length; i++)
                    {
                        var id = controlsWithBadge.eq(i).attr("id");
                        this._hideBadge(id);
                    }
                }
            }
        },

        _controlDragStopped: function ()
        {
            this._repositionBadges();
        },

        _repositionBadges: function ()
        {
            if (!checkExists(this.controlsBadgedwithAdornment) || this.controlsBadgedwithAdornment.length === 0)
            {
                return;
            }

            for (var key in this.controlsBadgedwithAdornment)
            {
                this._repositionBadge(key);
            }

            this._showBadges();
        },

        _hideBadges: function ()
        {
            if (!checkExists(this.controlsBadgedwithAdornment) || this.controlsBadgedwithAdornment.length === 0)
            {
                return;
            }

            for (var key in this.controlsBadgedwithAdornment)
            {
                this._hideBadge(key);
            }
        },

        _showBadges: function ()
        {
            if (!checkExists(this.controlsBadgedwithAdornment) || this.controlsBadgedwithAdornment.length === 0)
            {
                return;
            }

            for (var key in this.controlsBadgedwithAdornment)
            {
                this._showBadge(key);
            }
        },

        // appends badge error message to a control element 
        // options:
        // controlElem : jQuery element of the control to append the error message
        // message - error message to append to the element
        appendBadgeControlMessage: function (options)
        {
            if (checkExists(options.controlElem) && checkExistsNotEmpty(options.message))
            {
                var title = options.controlElem.attr('title');

                if (checkExistsNotEmpty(title))
                {
                    if (title.indexOf(options.message) >= 0)
                    {
                        //duplicate message already exist, just return and not add the message
                        return;
                    }

                    title += '\n';
                }
                else
                {
                    title = "";
                }

                title += options.message;

                options.controlElem.attr('title', title);
            }
        },

        // Check whether a Control element contained in a List Table should be badged on the column. 
        _shouldBadgeColumn: function (control)
        {
            if (!checkExists(control))
            {
                return false;
            }

            var closestTable = control.closest('.editor-table');

            if (checkExists(closestTable) &&
            checkExists(closestTable.parent()) &&
            checkExists(closestTable.parent().parent()) &&
            closestTable.parent().parent().attr('controltype') === 'ListTable')
            {
                if (checkExists(control.parent()) &&
                checkExists(control.parent().parent()) &&
                !control.parent().parent().hasClass('footer'))
                {
                    return true;
                }
            }

            return false;
        },

        /**
        * This function will use the controlid passed in to determine the correct control or controls to 
        * badge or unbadge.
        * For a control contained in a list view table, it will return the column header and column elements.
        * For a control that is the wrapper for a view control, it will return the view control element.
        * 
        * @param {text} controlId The id of control with error
        * 
        * @returns jquery control element to badge/unbadge (if no element found, returns an empty jquery object)
        * 
        */
        _getControlToBadge: function (controlId)
        {
            var control = null;

            if ($("#FormDesignerLayoutCanvasPaneContainer").length > 0)
            {
                //For form designer, the context browser tree node elements also have the controlId as the Id of the element. 
                //Thus we shall only search the controlId in the Form's canvas element.
                control = $("#FormDesignerLayoutCanvasPaneContainer").find("#{0}".format(controlId));
            }
            else
            {
                control = $("#{0}".format(controlId));
            }

            if (control.length === 0)
            {
                return control;
            }

            if (this._shouldBadgeColumn(control))
            {
                //For ListTable, badge error is applied on the column header and column cells
                var closestTable = control.closest('.editor-table');
                var td = $(control.closest('td'));

                if (checkExists(td))
                {
                    var index = td.parent().children().index(td);

                    control = closestTable.find('tr.header td:nth-child({0}), colgroup col:nth-child({0})'.format(index + 1));
                }
            }
            else if (control[0].tagName.toUpperCase() === "TD")
            {
                //If control is a view wrapper, it will return the view control
                var viewElem = control.find("[instanceid='{0}']".format(controlId));
                if (checkExists(viewElem))
                {
                    control = viewElem;
                }
            }

            return control;
        },

        //options:
        //{
        //    id: "id of the control",
        //    badgeType: "type of the badge",
        //    message: ["badge message 01", "badge message 02", ...] 
        //};
        addBadgeToControl: function (options)
        {
            //Class Badging
            var controlId = options.id;
            var control = this._getControlToBadge(controlId);
            var badgeClass = this.badgeClasses[options.badgeType]

            if (!badgeClass)
            {
                throw "Badge class not found for specified badge type";
            }

            control.addClass(badgeClass);
            options.controlElem = control;
            this.appendBadgeControlMessage(options);

            //Adornment Badging
            var cell = control.closest(".editor-cell");            
            var isListViewItem = cell.parent().is(".list-view-item");

            //[899886] Don't use absolute position badges on the List View table.  List View table uses pseduo badges.
            options.isCellBadge = cell.length > 0 && isListViewItem === false;

            this.controlsBadgedwithAdornment[options.id] = options;
            this._hideBadge(controlId);
            this._ensureRendered(controlId);
            this._repositionBadge(controlId);
            this._showBadge(controlId);
        },

        // Adds an error/warning badge to an array of controls on the canvas
        // options:
        // controls - An array containing control objects. Each object should contain the id of the control. This is usually a guid. Required.
        // badgeType - the type of badge. Look at the _badgeType object's properties at the top of the file for valid values. Required
        applyControlBadges: function (options)
        {
            if (!options.controls || !Array.isArray(options.controls))
            {
                throw "Array of controls expected";
            }

            var controls = options.controls;

            for (var i = 0; i < controls.length; i++)
            {
                if (!checkExists(controls[i].id))
                {
                    throw "Control object without id found.";
                }

                this.addBadgeToControl({ id: controls[i].id, badgeType: options.badgeType });
            }
        },

        removeBadgeFromControl: function (options)
        {
            var controlId = options.id;
            var control = this._getControlToBadge(controlId);

            var badgeClass = this.badgeClasses[options.badgeType];

            if (!badgeClass)
            {
                eachPropertyInObjects({
                    obj: this.badgeClasses,
                    callback: function (callbackBadgeType, callbackBadgeClass)
                    {
                        control.removeClass(callbackBadgeClass);
                        control.attr("title", "");
                    }
                });
            }
            else
            {
                control.removeClass(badgeClass);
                control.attr("title", "");
            }

            //remove adornment badge
            $("#badgeFor_" + controlId).remove();
            delete this.controlsBadgedwithAdornment[controlId];
        },

        // Removes an error/warning badge from an array of controls on the canvas
        // options:
        // controls - An array containing control objects. Each object should contain the id of the control. This is usually a guid. Required.
        // badgeType - the type of badge. Other types will be ignored. Look at the _badgeType object's properties at the top of the file for valid values.
        //				Optional. If it isn't specified, all badge types are removed
        removeControlsBadges: function (options)
        {
            if (!options.controls || !Array.isArray(options.controls))
            {
                throw "Array of controls expected";
            }

            var controls = options.controls;

            for (var i = 0; i < controls.length; i++)
            {
                if (!checkExists(controls[i].id))
                {
                    throw "Control object without id found.";
                }

                this.removeBadgeFromControl(
                {
                    id: controls[i].id,
                    badgeType: options.badgeType
                });
            }
        },

        _removeAllBadges: function ()
        {
            this._canvasCleared();
        },

        _hideBadge: function (controlId)
        {
            var badge = $("#badgeFor_" + controlId);
            badge.removeClass("show");
        },

        _showBadge: function(controlId)
        {
            var control = $("#" + controlId);

            var badge = $("#badgeFor_" + controlId);

            if (control.length > 0)
            {
                var options = this.controlsBadgedwithAdornment[controlId];
                if (options.isCellBadge)
                {
                    badge.addClass("show");
                }
            }
            else
            {
                badge.remove();
            }

        },

        _repositionBadge: function (controlId)
        {
            var control = $("#" + controlId);
            var badge = $("#badgeFor_" + controlId);
            if (!checkExists(control) || control.length === 0)
            {
                return;
            }

            var position = SourceCode.Forms.CanvasWidgetHelper.getAccurateLocation(control, this._getCanvas());

            var top = parseInt(position.top) - parseInt(badge.height()) / 2 + 1;
            var left = position.left + parseInt(control.outerWidth()) - parseInt(badge.outerWidth()) - 1;

            badge.css({ top: top, left: left });
        },

        _controlSelected: function (event, controlObjectModel)
        {
            this._lastSelectedId = this._getControlIdFromObjectModel(controlObjectModel);
            this._selectedControlObjectModel = controlObjectModel;
        },

        _getControlIdFromObjectModel: function (controlObjectModel)
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

        _controlStyleOrSizeChanged: function ()
        {
            //[900161 and 900170] Change the size or format (e.g. padding) of the control may change the position of the silbling or child controls thus the all badge position need to be updated
            this._repositionBadges();
        },

        _controlMoved: function ()
        {
            var id = this._lastDraggedId;
            var control = $("#" + id);
            var option = this.controlsBadgedwithAdornment[id];

            if (checkExists(option))
            {
                //[900162] When a control is moved into a table cell, it should use absolute position badge 
                option.isCellBadge = control.closest(".editor-cell").length > 0;
            }

            this._repositionBadges();
        },

        _ensureRendered: function (controlId)
        {
            if (!this._isRendered(controlId))
            {
                this._render(controlId);
            }
        },

        _isRendered: function (controlId)
        {
            var badgeElement = $("#badgeFor_" + controlId);

            var isRendered = false;

            if (checkExists(badgeElement) && badgeElement.length > 0)
            {
                var container = badgeElement.parent();

                //Ensure the badge is rendered under the scrollWrapper
                if (checkExists(container) && container.length > 0 && container[0] === this._getCanvas()[0])
                {
                    isRendered = true;
                }
                else
                {
                    badgeElement.remove();
                }
            }

            return isRendered;
        },

        _render: function (controlId)
        {
            var options = this.controlsBadgedwithAdornment[controlId];
            var element = this.templateElement.clone();

            element.attr("id", "badgeFor_" + controlId);
            element.addClass(options.badgeType);

            this.renderedConatiner = this._getCanvas().find("#pgOuterPanel, .canvas-layout-table").first();
            this.renderedConatiner.after(element);
        },

        _getCanvas: function ()
        {
            //agnostic to view or form designer
            var scrollWrapper = SourceCode.Forms.Designers.Common.getDesignerCanvasScrollWrapper();
            this.scrollWrapper = $(scrollWrapper);

            return this.scrollWrapper;
        },

        destroy: function ()
        {
            $(".canvas-badge").remove(); //remove() will also unbind previously-attached event handler from the element.

            this.controlsBadgedwithAdornment = null;
            this.scrollWrapper = null;

            SourceCode.Forms.Designers.Common.deregisterForEvent("DesignerChanged", this.designerChangedDelegate);
            SourceCode.Forms.Designers.Common.deregisterForEvent("CanvasCleared", this.canvasClearedDelegate);
            SourceCode.Forms.Designers.Common.deregisterForEvent("CanvasLoaded", this.layoutChangedDelegate);
            SourceCode.Forms.Designers.Common.deregisterForEvent("LayoutChanged", this.layoutChangedDelegate);

            SourceCode.Forms.Designers.Common.deregisterForEvent("RemoveBadgeToControl", this.removeBadgeToControlDelegate);
            SourceCode.Forms.Designers.Common.deregisterForEvent("RemoveAllBadges", this.removeAllBadgesDelegate);

            SourceCode.Forms.Designers.Common.deregisterForEvent("ControlSelected", this.controlSelectedDelegate);

            SourceCode.Forms.Designers.Common.deregisterForEvent("ControlStyleChanged", this.controlStyleOrSizeChangedDelegate);
            SourceCode.Forms.Designers.Common.deregisterForEvent("ControlSizeChanged", this.controlStyleOrSizeChangedDelegate);
            SourceCode.Forms.Designers.Common.deregisterForEvent("ControlMoved", this.controlMovedDelegate);

            SourceCode.Forms.Designers.Common.deregisterForEvent("ControlDragStarted", this.controlDragStartedDelegate);
            SourceCode.Forms.Designers.Common.deregisterForEvent("ControlDragStopped", this.controlDragStoppedDelegate);

            SourceCode.Forms.Designers.Common.deregisterForEvent("CellMerged", this.layoutChangedDelegate);
            SourceCode.Forms.Designers.Common.deregisterForEvent("RowsAdded", this.layoutChangedDelegate);
            SourceCode.Forms.Designers.Common.deregisterForEvent("RowsRemoved", this.layoutChangedDelegate);
            SourceCode.Forms.Designers.Common.deregisterForEvent("ColumnsAdded", this.layoutChangedDelegate);
            SourceCode.Forms.Designers.Common.deregisterForEvent("ColumnsRemoved", this.layoutChangedDelegate);
        }
    };

$.extend(ControlALMBadgeManager.prototype, _ControlALMBadgeManagerPrototype);
