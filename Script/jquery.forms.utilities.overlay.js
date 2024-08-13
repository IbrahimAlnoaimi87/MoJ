(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Widget === "undefined" || SourceCode.Forms.Widget === null) SourceCode.Forms.Widget = {};

    SourceCode.Forms.Widget.OverlayControl =
    {
        //NOTE overlays should only be shown after the WAIT_FOR time, 
        //       if they are shown instantly, then the UI will often have flickers of overlays.
        //       overlays must only be closed after MIN_OVERLAY_TIME, otherwise it will look like a flicker also.
        //       Set these Variables to 0 to get the old behavior.
        WAIT_FOR: 300, //number of millseconds to wait until an overlay should be shown.
        MIN_OVERLAY_TIME: 500, // the minimum amount of time an overlay should show for.
        _overlay: null,
        _showTimer: null,
        _hideTimer: null,
        _canClose: true,
        _closeRequested: false,

        _create: function ()
        {
            // Note: we must show on creation.
            // create will need to show also, to be compatible with the old overlay() method.
            this.showOverlay();
        },

        //is the overlay already showing?
        _isShowing: function ()
        {
            return (!!this._overlay);
        },

        _ensureOverlay: function ()
        {
            if (!checkExists(this._overlay))
            {
                var element = this.element;
                var classes = this.options.classes ? this.options.classes : "";
                classes += this.options.modal ? " k2-modal-overlay " : "";
                var html = "<div class=\"k2-overlay invisible-overlay " + classes + "\"></div>";
                element.after(html);

                this._overlay = element.next(".k2-overlay");
                if (this.options.icon !== "")
                {
                    this._overlay.append("<div class=\"k2-overlay-icon " + this.options.icon + "\"></div>");
                }
            }
        },

        _showOverlay: function ()
        {
            //console.log("Really Showing " + this.element.attr("class"));
            clearTimeout(this._showTimer);
            this._overlay.removeClass("invisible-overlay");
            this._canClose = false;
            
            //Sean: this should be removed and code using it fixed
            //No code should be dependent on the internal behaviour of the overlay
            if (typeof this.options.onShow === "function")
            {
                this.options.onShow();
            }

            this._hideTimer = setTimeout(this._minOverlayTimeCompleted.bind(this), this.MIN_OVERLAY_TIME)
        },

        _minOverlayTimeCompleted: function ()
        {
            this._canClose = true;
            if (this._closeRequested == true)
            {
                this._removeOverlay();
            }
            clearTimeout(this._hideTimer);
            clearTimeout(this._showTimer);
        },

        _canInstantlyClose: function ()
        {
            return this._canClose || !this._isShowing();
        },

        //public method to request that an overlay is shown for this element.
        showOverlay: function ()
        {
            //console.log("Showing " + this.element.attr("class"));

            //reset timers
            clearTimeout(this._hideTimer);
            clearTimeout(this._showTimer);

            //reset triggers
            this._canClose = true;
            this._closeRequested = false;

            if (!this._isShowing())
            {
                var element = this.element;
                var offset = element.position();

                this._ensureOverlay();

                if (element.css("position") !== "static" && element.css("position") !== "relative")
                {
                    this._overlay.css(
                    {
                        "top": offset.top + "px",
                        "left": offset.left + "px",
                        "width": element.outerWidth() + "px",
                        "height": element.outerHeight() + "px"
                    });
                }

                this._showTimer = setTimeout(this._showOverlay.bind(this), this.WAIT_FOR);
            }
        },

        //public method to request that the overlay be removed.
        removeOverlay: function ()
        {
            if (this._canInstantlyClose())
            {
                this._removeOverlay();
            }
            else
            {
                //wait for the MIN_OVERLAY_TIME timer to finish.
                this._closeRequested = true;
            }
        },

        _removeOverlay: function ()
        {
            //reset timers
            clearTimeout(this._hideTimer);
            clearTimeout(this._showTimer);

            //reset triggers
            this._canClose = true;
            this._closeRequested = false;

            //remove the overlay
            if (!!this._overlay)
            {
                this._overlay.remove();
                this._overlay = null;
            }
            if (typeof this.options.onHide === "function") this.options.onHide();
        }

    };

    $.widget("ui.overlaycontrol", SourceCode.Forms.Widget.OverlayControl);
    $.extend($.ui.overlaycontrol.prototype,
    {
        options:
        {
            modal: false,
            icon: "",
            classes: "",
            onHide: null,
            onShow: null,
        }
    });
})(jQuery);


(function ($)
{

    $.fn.overlay_old = function (options)
    {
        var settings = $.extend({
            modal: false,
            icon: "",
            classes: ""
        }, options);

        this.each(function ()
        {
            var element = $(this);
            var offset = element.position();
            var classes = settings.classes ? settings.classes : "";
            classes += settings.modal ? " k2-modal-overlay " : "";
            var html = "<div class=\"k2-overlay " + classes + "\"></div>";
            element.after(html);

            var overlay = element.next(".k2-overlay");

            if (element.css("position") !== "static" && element.css("position") !== "relative")
            {
                overlay.css({
                    "top": offset.top + "px",
                    "left": offset.left + "px",
                    "width": element.outerWidth() + "px",
                    "height": element.outerHeight() + "px"
                });
            }

            if (settings.icon !== "")
            {
                overlay.append("<div class=\"k2-overlay-icon " + settings.icon + "\"></div>");
                overlay.append("<div class=\"spinner-content\"><div class=\"spinner-content-inner\"><div class=\"spinner-header\"></div>"
                    + "<div class=\"spinner-icon\"><div class=\"s1\"></div><div class=\"s2\"></div><div class=\"s3\"></div>"
                    + "<div class=\"s4\"></div></div><div class=\"spinner-footer\"></div></div></div>");
            }
        });

        return this;
    };

    $.fn.removeOverlay_old = function ()
    {
        this.each(function ()
        {
            $(this).next(".k2-overlay").remove();
        });

        return this;
    };

    $.fn.overlay = function (options)
    {
        var settings = $.extend({
            modal: false,
            icon: "",
            classes: "",
            onHide: null,
            onShow: null,
        }, options);

        this.each(function ()
        {
            var element = $(this);
            var widget = $(this).data("ui-overlaycontrol");
            if (!!widget)
            {
                widget.showOverlay();
            }
            else
            {
                element.overlaycontrol(settings);
            }
        });

        return this;
    };

    $.fn.removeOverlay = function ()
    {
        this.each(function ()
        {
            var widget = $(this).data("ui-overlaycontrol");
            if (!!widget) widget.removeOverlay();
        });

        return this;
    };

})(jQuery);
