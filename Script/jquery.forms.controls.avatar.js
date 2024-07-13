(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Widget === "undefined" || SourceCode.Forms.Widget === null) SourceCode.Forms.Widget = {};

    SourceCode.Forms.Widget.Avatar =
        {

            _popup: null,
            _mousedownNameSpaceEvent: "mousedown.avatar-{0}",
            _dragNameSpaceEvent: "drag.avatar-{0}",
            _resizeNameSpaceEvent: "resize.avatar-{0}",

            _desiredPopuplocation: "right bottom",

            _create: function ()
            {
                //TODO: Create popover for avatar details and log-out link.

                this._initPopup();
                this._initImages();

                this._isPopupShowing = false;

                this.element.on("click", function (e)
                {
                    if (this._isPopupShowing === true)
                    {
                        this._closePopup();
                    }
                    else
                    {
                        this._showPopup();
                    }
                    //must not bubble through to document, otherwise it'll close this popup.
                    e.preventDefault();
                    return false;
                }.bind(this));
            },


            _initImages: function ()
            {
                var $this = this;

                //the url is added to the html by the c# control, server side.
                var avatarurl = this.element.metadata().avatarUrl;

                if (!!avatarurl)
                {
                    //get list of images that need updating with the custom avatar image.
                    this._largeImage = this._popup.find("#AvatarImageLarge");
                    this._smallImage = this.element.find("#AvatarImageSmall");
                    var images = this._largeImage.add(this._smallImage);

                    //download the profile image and apply it.
                    var downloadingImage = new Image();
                    downloadingImage.onload = function ()
                    {
                        var img = this;
                        if (!!img)
                        {
                            images.each(function ()
                            {
                                var jqimage = $(this);
                                jqimage.css("background-image", "url(\"" + img.src + "\")");
                                if (img.width > img.height)
                                {
                                    jqimage.css("background-size", "auto " + jqimage.height() + "px");
                                }
                                else
                                {
                                    jqimage.css("background-size", jqimage.width() + "px auto");
                                }
                                jqimage.addClass("personalized"); //we change the style of the images slightly.
                            });


                        }
                    };
                    //start loading the custom url image
                    downloadingImage.src = avatarurl;
                }
            },

            _initPopup: function ()
            {
                var template = this.element.next("#PopupContent");
                template.css({ position: "absolute", display: "none" });
                this._popup = template.appendTo($("body"));

                this._btnEmail = this._popup.find("#EmailLink");
                this._btnEmail.on("click", this._btnEmail_click.bind(this));

                var logoutButton = this._popup.find("#LogoutLink");
                if (logoutButton.length > 0)
                {
                    if (this.options.showLogout === false)
                    {
                        logoutButton.remove();
                    }
                }
                else
                {
                    this.options.showLogout = false;
                }

            },

            _btnEmail_click: function ()
            {
                var href = this._btnEmail.attr("href") + "&body=" + escape(window.location.href);
                this._btnEmail.trigger("focus"); //needed for the appstudio (beforeunload) to know whether confirm the navigatio away.
                window.location = href;
                this._closePopup();
                return false;
            },

            _popup_mousedown: function (e)
            {
                //must not bubble through to document, otherwise it'll close this popup.
                return false;
            },

            _popup_mouseover: function (e)
            {
                if (checkExists(this._popupCloseTimeout))
                {
                    // Clear the existing timeout first.
                    clearTimeout(this._popupCloseTimeout);
                    this._popupCloseTimeout = null;
                }

                // Reset/start timer again.
                if (checkExists(this.options.defaultOpenTimeout) && this.options.defaultOpenTimeout > 0)
                {
                    this._popupCloseTimeout = setTimeout(function ()
                    {
                        this._closePopup();
                        this._popupCloseTimeout = null;
                    }.bind(this), this.options.defaultOpenTimeout);
                }
            },

            _showPopup: function ()
            {
                //show the popup, but hidden, so we can get the size of it.
                var oldvis = this._popup.css("visibility");
                this._popup.css("visibility", "hidden");
                this._popup.show();

                this._positionPopup();
                this._popup.css("visibility", oldvis);

                $(window).on(this._resizeNameSpaceEvent, this._windowResize.bind(this));
                $(document).on(this._mousedownNameSpaceEvent, this._handleDocumentClick.bind(this));
                $(document).on(this._dragNameSpaceEvent, this._handleDocumentClick.bind(this));
                this._popup.on("mousedown", this._popup_mousedown.bind(this));
                this.element.on("mousedown", this._popup_mousedown.bind(this));

                // Handle the automatic closing of the popup.
                this._popup.on("mouseover", this._popup_mouseover.bind(this));
                // Start the timer.
                this._popup_mouseover();

                this._isPopupShowing = true;
            },

            _closePopup: function ()
            {
                this._popup.hide();
                this._unbindDocumentEvents();
                this._popup.off("mousedown", this._popup_mousedown.bind(this));
                this.element.off("mousedown", this._popup_mousedown.bind(this));
                this._popup.off("mouseover", this._popup_mouseover.bind(this));

                if (checkExists(this._popupCloseTimeout))
                {
                    // Clear the existing timeout first.
                    clearTimeout(this._popupCloseTimeout);
                    this._popupCloseTimeout = null;
                }

                this._isPopupShowing = false;
            },

            _unbindDocumentEvents: function ()
            {
                $(window).off(this._resizeNameSpaceEvent, this._windowResize.bind(this));
                $(document).off(this._mousedownNameSpaceEvent, this._handleDocumentClick.bind(this));
                $(document).off(this._dragNameSpaceEvent, this._handleDocumentClick.bind(this));
            },

            _handleDocumentClick: function (e)
            {
                this._closePopup();
            },

            _positionPopup: function ()
            {
                this._popup.position({ at: this._desiredPopuplocation, of: this.element, my: "right-5 top+5" });
            },

            _windowResize: function ()
            {
                if (this._popup.is(':visible'))
                {
                    this._positionPopup();
                }
            },

            _destroy: function ()
            {
                this._unbindDocumentEvents();
                if (!!this._popup) this._popup.remove();
            }

        };

    $.widget("ui.avatar", SourceCode.Forms.Widget.Avatar);
    $.extend($.ui.avatar.prototype,
        {
            options:
            {
                defaultOpenTimeout: 5000,
                showLogout:true
            }

        });


})(jQuery);
