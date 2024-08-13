(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Widget === "undefined" || SourceCode.Forms.Widget === null) SourceCode.Forms.Widget = {};

    //Quick access toolbar is used in the Form Designer to display a floating menu above a selected view item,
    //The floating menu allow the user to navigate to edit the selected view quickly.
    SourceCode.Forms.Widget.QuickAccessToolbar =
    {
        jqItem: null,

        _TEMPLATE: " \
            <div class='canvas-widget-ui right'> \
                <a target='_blank' class='edit-button'> \
                    <div class='view-name'></div> \
                    <div class= 'icon icon-size16' ></div> \
                </a> \
            </div> \
        ",

        _create: function ()
        {
            this.element.addClass("floating-view-menu");
            this.element.append($(this._TEMPLATE));
            this.nameElement = this.element.find(".view-name");
            this.btnEdit = this.element.find(".edit-button");

            this.controlSelectedDelegate = this._controlSelected.bind(this);
            this.controlMovedDelegate = this.controlMoved.bind(this);
            this.layoutChangedDelegate = this.layoutChanged.bind(this);
            this.scrollStartDelegate = this.scrollStart.bind(this);
            this.scrollEndDelegate = this.scrollEnd.bind(this);

            this.dragStartDelegate = this.dragStart.bind(this);
            this.dragEndDelegate = this.dragEnd.bind(this);
            this.controlMovedDelegate = this.dragEnd.bind(this);

            SourceCode.Forms.Designers.Common.registerForEvent("ControlSelected", this.controlSelectedDelegate);            
            SourceCode.Forms.Designers.Common.registerForEvent("ControlMoved", this.controlMovedDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("LayoutChanged", this.layoutChangedDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("ScrollStarted", this.scrollStartDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("ScrollEnded", this.scrollEndDelegate);

            SourceCode.Forms.Designers.Common.registerForEvent("ControlMoved", this.controlMovedDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("ControlDragStarted", this.dragStartDelegate);
            SourceCode.Forms.Designers.Common.registerForEvent("ControlDragStopped", this.dragEndDelegate);

            
        },

        _controlSelected: function (event, controlObjectModel)
        {
            if (controlObjectModel.controlType === "viewinstance")
            {
                this.controlObjectModel = controlObjectModel;
                this.jqItem = controlObjectModel.element;
                //visual element is what the control wants to be circled
                this.visualElement = controlObjectModel.visualElement; 
                this.update(controlObjectModel.element);
            }
            else
            {
                this.controlObjectModel = null;
                this.hide();
            }
        },

        isHidden: function ()
        {
            return !(this.element.hasClass("show"));
        },

        canShow: function ()
        {
            return (this.controlObjectModel !== null);
        },

        dragStart: function ()
        {
            this.hide();
        },

        dragEnd: function ()
        {
            if (this.canShow())
            {
                this.reposition();
                this.show();
            }
        },

        layoutChanged: function ()
        {
            if (this.isHidden()) return;
           
            this.reposition();
            this.show();
        },

        controlMoved: function ()
        {
            this.reposition();
            this.show();
        },

        scrollStart: function ()
        {
            this.hide();
        },

        scrollEnd: function ()
        {
            this.reposition();
            this.show();
        },

        show: function ()
        {
            if (!checkExists(this.jqItem) || this.jqItem.length === 0)
            {
                return;
            }

            var forceHide = false;
            var container = this.element.parent();

            if (container.length > 0)
            {
                //if the toolbar moved out of the parent's viewport, hide it
                var right = this.jqItem.offset().left + this.element.width();
                var maxRight = container.offset().left + container.width();

                if (top < container.offset().top || right > maxRight)
                {
                    this.hide();
                    forceHide = true;
                }
            }

            if (this.jqItem.hasClass("selected") && !forceHide)
            {
                this.element.addClass("show");
            }
        },

        hide: function ()
        {
            this.element.removeClass("show");
        },

        _updateName: function ()
        {
            if (this.jqItem.length>0)
            {
                if (checkExists(this.jqItem.data()) &&
                    checkExists(this.jqItem.data().canvas) &&
                    checkExists(this.jqItem.data().canvas.displayName))
                {
                    this.nameElement.text(this.jqItem.data().canvas.displayName);
                }
            }
        },

        //Make the floating menu stick to a selected view item
        update: function (selectedItem)
        {
            if (checkExists(selectedItem) && selectedItem.length > 0)
            {
                //Stick to a new item
                this.jqItem = $(selectedItem);

                this._updateName();

                if (this.jqItem.hasClass("view-canvas") && !this.jqItem.hasClass("unAuthorized") && !this.jqItem.hasClass("isSystem"))
                {
                    var actionHash = "#action=edit&datatype=view&guid=" + this.jqItem.data().canvas.viewid;

                    this.btnEdit.attr("href", actionHash);
                    this.element.attr('title', Resources.CommonLabels.EditView);
               }
                else
                {
                    this.btnEdit.addClass('unAuthorized');
                    this.btnEdit.removeAttr("href");
                    this.element.attr('title', Resources.CommonLabels.SystemViewsTooltip);
                }

                this.reposition();
                this.show();
            }
        },

        _getVisualElement: function ()
        {
            if (checkExists(this.visualElement) && this.visualElement.length > 0)
            {
                return this.visualElement;
            }

            return this.jqItem;
        },

        //When resizing or scrolling, we need to recalculate the floating menu to the correct position
        reposition: function ()
        {
            this.hide();

            if (!checkExists(this.jqItem) || this.jqItem.length === 0)
            {
                return;
            }

            var offset = this.jqItem.offset();

            var top = parseInt(offset.top) - parseInt(this.element.height());

            var padding = parseInt(this.element.css("padding-right"), 10);

            padding = isNaN(padding) ? 0 : padding; //parsing an string to Int will result as NaN, set it to 0 if it is the case

            var scrollWrapper = this.element.parent();

            var position = SourceCode.Forms.CanvasWidgetHelper.getAccurateLocation(this._getVisualElement(), scrollWrapper);

            //var left = parseInt(offset.left) + parseInt(this.jqItem.width()) - parseInt(this.element.width()) - padding;
            var left = position.left + parseInt(this._getVisualElement().outerWidth()) - padding;


            //this.element.offset({ top: top, left: left });
            this.element.css({ top: position.top, left: left });
        }
    };

    $.widget("ui.quickaccesstoolbar", SourceCode.Forms.Widget.QuickAccessToolbar);
    $.extend($.ui.quickaccesstoolbar.prototype,
	{
        options:
		{
		}
	});
})(jQuery);
