(function ($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Widget === "undefined" || SourceCode.Forms.Widget === null) SourceCode.Forms.Widget = {};

    //using statement
    var ExceptionHandler = SourceCode.Forms.ExceptionHandler;

    /*
    <.aspx>.Page_Load dependency:
    this.TransformResourceToJSVar(new String[] { "MessageBox", "WizardButtons" }, true);
    */

    /* Fields */
    jQuery.popupManager = new PopupManager();

    //PopupManager
    function PopupManager()
    {
        this.window = window;
    }

    PopupManager.prototype.getContainer = function ()
    {

        if (typeof this.container === "undefined")
        {
            this.container = $("<div class=\"popupManager\"></div>");
            $(document.body).append(this.container);
        }
        if (this.container.parent().css("position") === "relative")
        {
            this.container.css({
                "position": "absolute",
                "left": "0px",
                "top": "0px",
                "right": "0px",
                "bottom": "0px"
            });
            this.container.css({
                "height": this.container.height() - this.container.offset().top,
                "width": this.container.width() - this.container.offset().left
            });
        }

        return this.container;
    };

    //_addPopup
    PopupManager.prototype._addPopup = function (pPopUp)
    {
        if (!checkExists(this.popUps))
            this.popUps = [];

        this.popUps.push(pPopUp);
    };

    //_removePopup
    PopupManager.prototype._removePopup = function (pPopUp)
    {
        if (!checkExists(this.popUps))
            return;

        var _index = this.popUps.indexOf(pPopUp);

        if (_index === -1)
            return;

        this.popUps.splice(_index, 1);
    };

    PopupManager.prototype._getLastPopup = function (testFunction)
    {
        if (checkExists(this.popUps))
        {
            var i = this.popUps.length;

            while (i--)
            {
                var popup = this.popUps[i];

                if (testFunction(popup))
                {
                    return popup;
                }
            }
        }
    };

    //closeLast
    PopupManager.prototype.closeLast = function (pCloseOptions)
    {
        var lastPopup = this.getLastOpenPopup();

        if (checkExists(lastPopup))
        {
            this.closeSpecific(lastPopup, pCloseOptions);
        }
    };

    //closeSpecific
    PopupManager.prototype.closeSpecific = function (specificPopup, pCloseOptions)
    {
        if (checkExists(specificPopup) && specificPopup.isOpen()) //check to ensure that we have a popup that can still be closed
        {
            $("#" + specificPopup.id).find("select").each(function ()
            {
                if ($(this).isWidget("dropdown"))
                {
                    $(this).dropdown("hidedropdown");
                }
            });
            specificPopup.close(pCloseOptions);
        }
    };

    /*
        closeAll
        - Purpose is to close all 'child' popups opened by the opener, then close the opener as well. 
        - As the popups are created and added sequentially, any added after the opener should have been created by something in the opener.
        Parameters:
        - opener: can be either :
            - a popup as returned by popupManager.getPopup(pID)
            - the jQuery element as returned by popupManager.createPopup(...)
            - or a string id of a popup
        - pCloseOptions: an object with the closing options
    */
    PopupManager.prototype.closeAll = function (opener, pCloseOptions)
    {
        var openerId = opener;
        if (typeof opener !== "string")
        {
            openerId = opener.id;
        }
        else if (typeof opener.jquery === "string")
        {
            openerId = opener.popupwindow().id;
        }

        // check popup target exists in collection
        var popupToClose = this.getPopup(openerId);
        if (popupToClose === null)
        {
            return;
        }

        do
        {
            var lastPopup = this.getLastOpenPopup();
            if (checkExists(lastPopup))
            {
                this.closeSpecific(lastPopup, pCloseOptions);
            }
        }
        while (checkExists(lastPopup) && lastPopup.id !== openerId);
    };

    PopupManager.prototype.hasClosingPopups = function ()
    {
        var popupFound = this._getLastPopup(function (popup)
        {
            return !popup.isOpen();
        });
        return checkExists(popupFound);
    };

    //getLastModal
    PopupManager.prototype.getLastModal = function ()
    {
        var popupFound = this._getLastPopup(function (popup)
        {
            return popup.options.modal;
        });
        return popupFound;
    };

    PopupManager.prototype.getLastOpenModal = function ()
    {
        var popupFound = this._getLastPopup(function (popup)
        {
            return popup.isOpen() && popup.options.modal;
        });
        return popupFound;
    };

    PopupManager.prototype.getLastOpenPopup = function ()
    {
        var popupFound = this._getLastPopup(function (popup)
        {
            return popup.isOpen();
        });
        return popupFound;
    };

    //getPopup
    PopupManager.prototype.getPopup = function (pId)
    {
        var searchId = pId;
        var popupFound = this._getLastPopup(function (popup)
        {
            return popup.id === searchId;
        });
        return popupFound;
    };

    //isAnyPopupShown
    PopupManager.prototype.isAnyPopupShown = function ()
    {
        var popupFound = this._getLastPopup(function (popup)
        {
            return popup.visible;
        });
        return checkExists(popupFound);
    };

    PopupManager.prototype._getOptions = function (pOptions)
    {
        var options = {};
        if (typeof pOptions === 'string')
        {
            options =
            {
                message: pOptions
            };
        }
        else
        {
            options = pOptions;
        }
        return options;
    };

    //showConfirmation
    PopupManager.prototype.showConfirmation = function (pOptions)
    {
        var box = $("<div></div>");
        this.getContainer().append(box);
        box.confirmationbox($.extend(this._getOptions(pOptions), { type: "confirmation" }));
        return box.confirmationbox("show");
    };

    //showError
    PopupManager.prototype.showError = function (pMessage)
    {
        var box = $("<div></div>");
        this.getContainer().append(box);
        box.errorbox($.extend(this._getOptions(pMessage), { type: "error" }));
        return box.errorbox("show");
    };

    //showNotification
    PopupManager.prototype.showNotification = function (pOptions)
    {
        var box = $("<div></div>");
        this.getContainer().append(box);
        box.notificationbox($.extend(this._getOptions(pOptions), { type: "info" }));
        return box.notificationbox("show");
    };

    //showMessage
    PopupManager.prototype.showMessage = function (pOptions)
    {
        var box = $("<div></div>");
        this.getContainer().append(box);
        box.messagebox(this._getOptions(pOptions));
        return box.messagebox("show");
    };

    //showPopup
    PopupManager.prototype.showPopup = function (pOptions)
    {
        return this.createPopup(pOptions).popupwindow("show");
    };

    //showPopup
    PopupManager.prototype.createPopup = function (pOptions)
    {
        var box = $("<div></div>");
        this.getContainer().append(box);
        return box.popupwindow(this._getOptions(pOptions));
    };

    PopupManager.prototype.refreshPriorPopupsForIE = function ()
    {
        if (SourceCode.Forms.Browser.msie && SourceCode.Forms.Browser.version > 8)
        {
            //IE 9 Title fix complete hack
            var allpopups = $.popupManager.popUps;
            if (checkExists(allpopups))
            {
                var popupLength = allpopups.length;
                if (checkExists(popupLength) && popupLength > 1)
                {
                    var templ = popupLength - 1;
                    var itemsToShow = [];
                    while (templ--)
                    {
                        var currentPopup = allpopups[templ];
                        if (checkExists(currentPopup))
                        {
                            var currentControls = currentPopup.controls;
                            if (checkExists(currentControls))
                            {
                                var mainControl = currentControls.main;
                                if (checkExists(mainControl) && mainControl.length > 0)
                                {
                                    var mainStyle = mainControl[0].style;
                                    if (checkExists(mainStyle) && mainStyle.display !== "none")
                                    {
                                        mainStyle.cssText += "";
                                    }
                                }
                            }
                        }

                    }
                }
            }
        }
    };

    //showExtendedMessage
    PopupManager.prototype.showExtendedMessage = function (pOptions)
    {
        var box = $("<div></div>");
        this.getContainer().append(box);
        box.extendedbox($.extend(this._getOptions(pOptions), { cssClass: "extended-message" }));
        return box.extendedbox("show");
    };

    //showWarning
    PopupManager.prototype.showWarning = function (pOptions)
    {
        var box = $("<div></div>");
        this.getContainer().append(box);
        box.warningbox($.extend(this._getOptions(pOptions), { type: "warning" }));
        return box.warningbox("show");
    };

    //showError
    PopupManager.prototype.showCategoryBrowserPopup = function (pOptions)
    {
        var box = $("<div></div>");
        this.getContainer().append(box);
        box.categorybrowserpopup($.extend(this._getOptions(pOptions), { cssClass: "category-browser" }));
        return box.categorybrowserpopup("show");
    };

    //PopupWindow
    var defaultPopupHeight = 100; // The height for the Header and Footer only
    SourceCode.Forms.Widget.PopupWindow =
    {

        //defaults
        options:
        {
            width: 200,
            height: defaultPopupHeight,
            closeObj: null,
            setInnerDimensions: false,
            centered: true,
            show: true,
            showHeaderButtons: true,
            resizable: false,
            draggable: true,
            modal: true,
            maximizable: false,
            maximized: false,
            minimizable: false,
            minimized: false,
            showContentOnly: false,
            elementToFocusOnClose: null
        },

        _create: function ()
        {
            if (SourceCode.Forms.Layout.isRuntime())
            {
                setTabIndexesToNone();
            }

            var o = this.options;
            this.controls =
            {
                main: null,
                header: null,
                body: null,
                footer: null,
                buttonbar: null,
                mainbuttongroup: null, //main button group for Ok/Cancel buttons (designtime)
                toolbuttongroup: null //additional button group for tool buttons like help/togglepanel (designtime)
            };

            this.visible = false;
            this.buttonbar = null;

            this._restore =
            {
                width: 0,
                height: 0,
                top: 0,
                left: 0
            };

            this._heightClass = '';

            // Create the PopupWindow Element
            this._attach();

            if (this.options.modal)
                this._makeModal();

            this._setHeader();
            //NWR
            if ($("html").hasClass("safari") && $("html").hasClass("mobile"))
            {
                this.element.remove();
            }

            // Setting the Buttons
            this._setButtons();

            //Will also lazy-load content - needs the buttons to be loaded
            this._setContent();

            // Setting & Calculating Dimensions
            if (this.options.setInnerDimensions)
            {
                this._calculateInnerDimensions();
            } else
            {
                this._calculateOuterDimensions();
            }

            // Setting a unique identifier for the popup
            this.id = this.options.id || "PopupWin_" + "".generateGuid();
            this.controls.main.attr("id", this.id);

            this.controls.main.addClass(this._getDialogClassnames());

            // Adding Dragging Handlers
            if (this.options.draggable)
                this._makeDraggable();

            // Apply resize handlers
            if (this.options.resizable)
                this._applyResizeHandles();

            // Applying Header Buttons
            if ((!this.options.showContentOnly) && (this.options.showHeaderButtons))
                this._setHeaderButtons();

            // Applying Close Buttons
            if (typeof this.options.closeWith !== 'undefined')
                this._applyCloseControls();

            // Centering window
            if (this.options.centered)
            {
                this.center();
            }
            else
            {
                if (!this.visible)
                {
                    this.controls.main.show();
                }
                this.controls.main.css({
                    'top': '0px',
                    'left': '0px'
                });

                if (!this.visible)
                    this.controls.main.hide();
            }

            // Hiding an empty button bar
            if (!checkExists(this.options.buttons) || this.options.buttons.length === 0)
            {
                jQuery(this.controls.main).addClass("no-buttons");
            }

            //NWR
            if ($("html").hasClass("safari") && $("html").hasClass("mobile"))
            {
                $.popupManager.container.append(this.element);
            }

            $.popupManager._addPopup(this);

            if (SourceCode.Forms.Layout.isRuntime())
            {
                var popups = $.popupManager.popUps;
                var length = popups.length;

                if (!checkExists($.popupManager.elementsToFocusCollection))
                {
                    $.popupManager.elementsToFocusCollection = [];
                }

                var elementToFocusOnClose = this.options.elementToFocusOnClose;
                if (!checkExists(elementToFocusOnClose))
                {

                    if (length > 1)
                    {
                        var iframeElement = popups[length - 2].element.find("iframe");
                        if (iframeElement.length > 0)
                        {
                            var iframeContents = iframeElement.contents();
                            if (iframeContents.length > 0)
                            {
                                try
                                {
                                    elementToFocusOnClose = $(iframeContents[0].activeElement);
                                }
                                catch (exc)
                                {

                                }
                            }
                        }
                    }

                    if (!checkExists(elementToFocusOnClose))
                    {
                        try
                        {
                            // Attempts to access the document.activeElement (IE8/9)
                            var actEl = document.activeElement;
                        }
                        catch (e)
                        {
                            // If failed, set focus to documentElement to avoid future errors.
                            document.documentElement.focus();
                        }

                        elementToFocusOnClose = typeof document.activeElement !== "undefined" && checkExists(document.activeElement) ? $(document.activeElement) : null;

                        // sometimes with popups the body is active when you click on a button... But only sometimes.
                        if (checkExists(elementToFocusOnClose) && elementToFocusOnClose.length > 0 && checkExists(elementToFocusOnClose[0].tagName) && elementToFocusOnClose.is("body") && typeof event !== "undefined" && checkExists(event))
                        {
                            elementToFocusOnClose = $(event.target);
                        }
                    }
                }

                if (checkExists(elementToFocusOnClose) && elementToFocusOnClose.length > 0)
                {
                    $.popupManager.elementsToFocusCollection.push(elementToFocusOnClose);
                }

                if (SourceCode.Forms.Layout.isRuntime())
                {
                    this._setPopupFocus();
                }
            }
        },

        _getDialogClassnames: function ()
        {
            // Setting a specfic class on the popup dialog
            var dialogCssClasses = ["dialog"];

            if (checkExistsNotEmpty(this.options.type))
            {
                dialogCssClasses.push(this.options.type + "-message");
                dialogCssClasses.push("auto-scale-height");

                if (this.options.type === "error" ||
                    this.options.type === "info" ||
                    this.options.type === "warning")
                {
                    dialogCssClasses.push("simple-message-content");
                }
            }

            if (this.options.cssClass !== undefined && this.options.cssClass !== "")
            {
                dialogCssClasses.push(this.options.cssClass);
            }
            return dialogCssClasses.join(" ");
        },

        _setPopupFocus: function ()
        {
            try //try catch since document.activeElement can throw an exeception in certain browsers under certain circumstances
            {
                var activeElement = document.activeElement;

                if (this._isValidActiveElement(activeElement) && activeElement.tagName.toLowerCase() !== "body")
                {
                    $(activeElement).trigger("blur"); //blur this so that if focus is not set for some reason, tabbing will automatically start on the popup.
                }
            }
            catch (e)
            {
                // all we wanted was to remove focus, so if we cant do that no worries.
            }

            var numberOfPopups = checkExists($.popupManager) && checkExists($.popupManager.popUps) ? $.popupManager.popUps.length : 0;

            // set focus to the popup
            if (numberOfPopups > 0)
            {
                var currentPopup = $.popupManager.popUps[numberOfPopups - 1];

                if (checkExists(currentPopup) && checkExists(currentPopup.element) && currentPopup.element instanceof jQuery)
                {
                    var firstItem = null;
                    var iframe = currentPopup.element.find("iframe");

                    if (iframe.length > 0)
                    {
                        if (!iframe.hasClass("runtime-popup"))
                        {
                            iframe.on('load', function ()
                            {
                                $(this).contents().find("a, input[type!='hidden'], textarea, [tabindex][tabindex!='-1']").first().trigger("focus");
                            });
                        }
                    }
                }
            }
        },

        //_build
        html: function (options)
        {
            return "<div class=\"popup-header\"><div class=\"popup-header-l\"></div><div class=\"popup-header-c\"><div class=\"popup-header-wrapper\"><div class=\"wrapper\"><div class=\"popup-header-text\"></div><div class=\"popup-header-buttons\"><div class=\"popup-header-button-bar\"><div class=\"popup-header-button-bar-wrapper\"></div></div></div></div></div></div><div class=\"popup-header-r\"></div></div><div class=\"popup-body\"><div class=\"popup-body-l\"></div><div class=\"popup-body-c\"><div class=\"popup-body-content\"><div class=\"scroll-wrapper\"></div></div></div><div class=\"popup-body-r\"></div></div><div class=\"popup-footer\"><div class=\"popup-footer-l\"></div><div class=\"popup-footer-c\"></div><div class=\"popup-footer-r\"></div></div><div class=\"popup-closing-modal hidden\"></div>";
        },

        _attach: function ()
        {
            if (!this.element.hasClass("popup") || this.element.find(".popup-header").length === 0)
            {
                this.element.addClass("popup");

                if (!this.options.showContentOnly)
                {
                    this.element.html(this.html());
                }
            }
            this.controls.main = this.element;
            this.controls.header = this.controls.main.find('.popup-header');
            this.controls.body = this.controls.main.find('.popup-body');
            this.controls.footer = this.controls.main.find('.popup-footer');
            this.controls.buttonbar = this.controls.footer.find('.button-bar');
        },

        //_makeModal
        _makeModal: function ()
        {
            modalizer.show(false, null, null, true, false, { excludeFromVisibilityCalculations: true });
            $(modalizer["element"]).insertBefore(this.element);
        },

        //_applyResizeHandles
        _applyResizeHandles: function ()
        {
            this.controls.main.css("position", "absolute");
            this.controls.main.resizable();
        },

        //_makeDraggable
        _makeDraggable: function ()
        {
            if ($(document.documentElement).hasClass('mobile'))
            {
                this.options.draggable = false;
                return;
            }

            var target = this.controls.main,
                handler = function (event, ui)
                {
                    SourceCode.Forms.Widget.fixPosition(ui); // fix for jquery.ui bug where dialog window jumps to bottom of long page when dragged (https://bugs.jqueryui.com/ticket/9315#no1)
                    SourceCode.Forms.Widget.createUnderlay(target);
                };

            target.SFCPopupdraggable({
                handle: this.controls.header[0],
                containment: "window",
                stop: handler,	// Ensures that the iframe is consistently placed below the target
                drag: handler
            });
        },

        //_setHeader
        _setHeader: function (text)
        {
            if (!checkExists(text))
            {
                if (checkExists(this.options.headerText))
                    text = this.options.headerText;
                else
                    text = "";
            }
            var headerText = this.controls.header.find('.popup-header-text');
            headerText.html(text.htmlEncode());
            headerText.attr("title", text);

        },

        //getControls
        getControls: function ()
        {
            return this.controls;
        },

        _useRuntimeButtons: function ()
        {
            return typeof initializeRuntimeForm === "function" && checkExists(SourceCode) && checkExists(SourceCode.Forms) && checkExists(SourceCode.Forms.Controls) && checkExists(SourceCode.Forms.Controls.Web) && checkExists(SourceCode.Forms.Controls.Web.Button);
        },

        //get the element where buttonbars and buttons can be added.
        _getFooterContentContainer: function ()
        {
            return this.controls.footer.find('.popup-footer-c');
        },

        //designtime - ensure the button bar exists with the internal structure needed for design time
        _ensureButtonBar: function ()
        {
            //add the button bar 
            if (!checkExists(this.controls.buttonbar) || (!!this.controls.buttonbar && this.controls.buttonbar.length === 0))
            {
                var buttonBarHtml = jQuery(SourceCode.Forms.Widget.ButtonBar.html());
                this._getFooterContentContainer().append(buttonBarHtml);
                this.controls.buttonbar = buttonBarHtml.buttonBar();
            }

            //add the standard button bar groups expected in a popup-footer (left and right groups)
            if (this.controls.buttonbar.buttonBar("getGroups").length == 0)
            {
                this.controls.toolbuttongroup = this.controls.buttonbar.buttonBar("addButtonGroupFromOptions", { alignment: 'left' });
                this.controls.mainbuttongroup = this.controls.buttonbar.buttonBar("addButtonGroupFromOptions", { alignment: 'right' });
            }
        },

        //_setButtons
        _setButtons: function ()
        {
            if (!checkExists(this.options.buttons))
                return;

            if (!(this.options.buttons.length && this.options.buttons.length > 0))
                return;

            //THE MOO outside
            if (!this._useRuntimeButtons())
            {
                this._setButtons_Designtime();
            }
            else
            {
                this._setButtons_Runtime();
            }

        },

        _setButtons_Designtime: function ()
        {
            this._ensureButtonBar();

            //Main buttons (typically in the right side of the footer)
            for (var i = 0; i < this.options.buttons.length; i++)
            {
                switch ($type(this.options.buttons[i]))
                {
                    case "object":
                        var buttonOptions = this.options.buttons[i];

                        //if a separate list of tool buttons hasn't been specified, then
                        //automatically make the help button go inside the toolgroup.
                        if (!!this.options.toolbuttons)
                        {
                            this.controls.mainbuttongroup.buttonGroup("addButtonFromOptions", buttonOptions);
                        }
                        else
                        {
                            if (!!buttonOptions.type && buttonOptions.type === "help")
                            {
                                this.controls.toolbuttongroup.buttonGroup("addButtonFromOptions", buttonOptions);
                            }
                            else
                            {
                                this.controls.mainbuttongroup.buttonGroup("addButtonFromOptions", buttonOptions);
                            }
                        }

                        break;
                    case "string":
                    default:
                        break;
                }
            }

            //Tool buttons (typically in the left side of the footer)
            if (this.options.toolbuttons && this.options.toolbuttons.length && this.options.toolbuttons.length > 0)
            {
                for (var i = 0; i < this.options.toolbuttons.length; i++)
                {
                    switch ($type(this.options.toolbuttons[i]))
                    {
                        case "object":
                            var buttonOptions = this.options.toolbuttons[i];
                            this.controls.toolbuttongroup.buttonGroup("addButtonFromOptions", buttonOptions);
                            break;
                    }
                }
            }
        },

        _setButtons_Runtime: function ()
        {
            for (var i = 0; i < this.options.buttons.length; i++)
            {
                var o = this.options.buttons[i];
                var htmlTemplate = "<a {0} title='{1}' class='SFC SourceCode-Forms-Controls-Web-Button button{2}' href='javascript:;'>{3}{4}</a>";
                var formatArray = [];
                formatArray[0] = (o.id) ? "id='{0}'".format(o.id) : "";
                formatArray[1] = (o.title) ? o.title : "";
                formatArray[2] = (o.type) ? " " + o.type : "";
                formatArray[2] += (!o.enabled && o.enabled === false) ? ((o.type) ? " " : "") + "disabled" : "";
                formatArray[3] = (o.type) ? "<span class='Button-Image icon icon-size16'></span>" : "";
                formatArray[4] = (o.text) ? o.text : "";
                var htmlResult = htmlTemplate.format(formatArray);


                var button = $(htmlResult);
                this.controls.footer.find('.popup-footer-c').append(button);

                //init button
                var options = {};
                if (o.click)
                    options.click = o.click;
                button.SFCButton(options);
            }

        },

        //_calculateOuterDimensions
        _calculateOuterDimensions: function ()
        {
            if (this.options.width !== -1 && this.options.height !== -1)
            {
                this.controls.main.css({
                    "width": this.options.width + "px",
                    "height": this.options.height + "px"
                });
            }

            var _wasVisible = this.visible;
            //Making the elements visible to calculate the heights
            if (!_wasVisible)
                this.controls.main.show();

            var _innerHeight = this.options.height;

            _innerHeight -= this.controls.header.height();
            _innerHeight -= this.controls.footer.height();

            //Hiding it again after calculations
            if (!_wasVisible)
                this.controls.main.hide();
        },

        //_calculateInnerDimensions
        _calculateInnerDimensions: function ()
        {
            if (this.options.width !== -1 && this.options.height !== -1)
            {
                this.controls.main.css({
                    "width": this.options.width + "px",
                    "height": this.options.height + "px"
                });
            }
        },

        //Public setContent
        content: function (jqContent)
        {
            this.options.content = jqContent;
            this._setContent();
        },

        //_setContent
        // Add Content to the popupbody
        // If the content is null, show a spinner.
        _setContent: function ()
        {
            var _options = this.options;
            var _content = _options.content;

            if (!checkExists(_content))
                _content = _options.message;


            //Get the Content element, where the _content will be appended.
            var _jqWrapper = null;
            if (this.options.showContentOnly)
            {
                _jqWrapper = jQuery(this.controls.main);
            }
            else
            {
                _jqWrapper = jQuery(this.controls.body).children().eq(1).children().first().children().first();
            }

            //if the content is to be lazy-loaded
            if (!checkExists(_content) && typeof (this.options.contentUrl == "string"))
            {
                this.controls.body.overlay({ modal: true, icon: "loading", classes: "popup-loading" });

                //initialize the buttons
                this.controls.buttons = this.controls.footer.find("a.button, SourceCode-Forms-Controls-Web-Button");
                this.controls.buttons.k2button();
                this.controls.buttons.k2button("disable");

                _jqWrapper.load(this.options.contentUrl, this.options.contentData, function (data, status, xhr)
                {
                    //We can't abort a "load" method
                    //so if the dialog has been closed while we're loading, we simply do not process the response at all.
                    if (this.isClosing == true) return;

                    this.controls.body.removeOverlay();

                    if (SourceCode.Forms.ExceptionHandler.AjaxUnsuccessful(xhr, status, data))
                    {
                        //Loading Failed.
                        if (typeof this.options.onContentLoadException === "function")
                        {
                            this.options.onContentLoadException(xhr, status, data)
                        }
                        else
                        {
                            SourceCode.Forms.ExceptionHandler.AddErrorHTML(_jqWrapper, xhr, status, data);
                        }

                        this.controls.buttons.k2button("disable");
                    }
                    else
                    {
                        this.controls.buttons.k2button("enable");
                        //Everything loaded OK
                        if (typeof this.options.onContentLoaded === "function")
                        {
                            this.options.onContentLoaded(_jqWrapper, data, status, xhr);
                        }
                    }
                }.bind(this));
            }
            else
            {
                //If not lazy-loading, and there is content specified.
                if (checkExists(_content))
                {
                    if (typeof _content === "string")
                    {
                        if (_content.charAt(0) === '#')
                            _content = jQuery(_content);
                    }
                    else if (!checkExists(_content.jquery))
                    {
                        _content = jQuery(_content);
                    }

                    if (!checkExists(_content.jquery))
                        _jqWrapper.html(_content);
                    else
                    {
                        _content.appendTo(_jqWrapper);
                        _content.show();
                    }
                }
            }
        },

        //_applyCloseControls
        _applyCloseControls: function ()
        {
            switch ($type(this.options.closeWith))
            {
                case "array":
                    break;
                case "element":
                    jQuery(this.options.closeWith).on("click", function ()
                    {
                        this.close();
                    }.bind(this));
                    break;
                case "string":
                    var elem = document.getElementById(this.options.closeWith);
                    if (checkExists(elem))
                    {
                        jQuery(elem).on('click', function ()
                        {
                            this.close();
                        }.bind(this));
                    }
                    break;
            }
        },

        //_setHeaderButtons
        _setHeaderButtons: function ()
        {
            var buttonSizes = 0;
            if (this.options.showHeaderButtons === true)
            {
                // Header Buttons Container
                var _headerButtons = this.controls.header.find('.popup-header-button-bar-wrapper');

                // Minimize Button
                if (this.options.minimizable)
                {
                    var _miniButton = jQuery("<a class='minimize' href='javascript:;' title='" + Resources.CommonActions.Maximize + "'></a>");
                    _headerButtons.append(_miniButton);

                    _miniButton.html("<span></span>");

                    _miniButton.on("click", this.minimise.bind(this));
                    if (!checkExists(SourceCode.Forms.Widget.PopupWindow.headerButtonMaxWidth))
                        SourceCode.Forms.Widget.PopupWindow.headerButtonMaxWidth = _miniButton.outerWidth(true);
                    buttonSizes += SourceCode.Forms.Widget.PopupWindow.headerButtonMaxWidth;
                }

                // Maximize/Restore Button
                if (this.options.maximizable)
                {
                    var _maxButton = jQuery("<a class='maximize' href='javascript:;' title='" + Resources.CommonActions.Maximize + "'></a>");
                    _headerButtons.append(_maxButton);

                    _maxButton.html("<span></span>");

                    _maxButton.on("click", this.maximise.bind(this));

                    var _this = this;
                    this.controls.header.find('.popup-header-text').on('dblclick', function (ev) { _this.doubleClickMaximise(ev); });
                    if (!checkExists(SourceCode.Forms.Widget.PopupWindow.headerButtonMinWidth))
                        SourceCode.Forms.Widget.PopupWindow.headerButtonMinWidth = _maxButton.outerWidth(true);
                    buttonSizes += SourceCode.Forms.Widget.PopupWindow.headerButtonMinWidth;
                }

                // Close Button
                var _closeButton = jQuery("<a class='close' href='javascript:;' title='" + Resources.CommonActions.Close + "'></a>");
                _headerButtons.append(_closeButton);
                _closeButton.html("<span></span>");
                _closeButton.on("click", function ()
                {
                    //when the X button is clicked, it should behave like a cancel
                    //if optional onCancel function is specified (such as with confirmation messages) this should fire instead of normal closing logic
                    if (!this.options.onCancel)
                    {
                        //limiting this new closing logic to runtime for now
                        if (SourceCode.Forms.Layout.isRuntime())
                        {
                            //unbind the close button click event to block multiple clicks and the execution of the code connected to the event
                            _closeButton.off("click");

                            var _this = this;

                            var popupContentWindow = null;
                            var popupContentWindowDocument = null;
                            var popupDocReadyState = null;

                            if (checkExists(_this.controls) && checkExists(_this.controls.main))
                            {
                                var popupIframe = _this.controls.main.find("iframe");

                                var popupContentWindow = _this._getPopupIframeContentWindow(popupIframe);
                                if (popupContentWindow !== null)
                                {
                                    popupContentWindowDocument = (typeof (popupContentWindow.document) === "undefined") ? null : popupContentWindow.document;

                                    if (popupContentWindowDocument !== null)
                                    {
                                        popupDocReadyState = (typeof (popupContentWindowDocument.readyState) === "undefined") ? null : popupContentWindowDocument.readyState;
                                    }
                                }
                            }

                            if ((popupContentWindowDocument === null) || ((popupDocReadyState === "complete") && (typeof (popupContentWindow._runtimeScriptsLoaded) !== "undefined")))
                            {

                                //if there is no accessible window object inside the iframe or the content of the window object is completely loaded, it is safe to just close
                                _this.close();
                            }
                            else
                            {

                                //if there is an accessible window object inside the iframe and the content of the window object is not completely loaded yet, wait for the loading to be completed before trying to close to avoid possible script loading errors
                                var checkReadyStateInterval = setInterval(function ()
                                {
                                    //can't use cached popupContentWindowDocument variable; IE gives permission denied errors; have to find the document again
                                    popupContentWindow = _this.controls.main.find("iframe")[0].contentWindow;
                                    popupContentWindowDocument = popupContentWindow.document;
                                    popupDocReadyState = (typeof (popupContentWindowDocument.readyState) === "undefined") ? null : popupContentWindowDocument.readyState;

                                    if ((popupDocReadyState === "complete") && (typeof (popupContentWindow._runtimeScriptsLoaded) !== "undefined"))
                                    {
                                        //the content of the window object is now completely loaded, it is safe to close
                                        clearInterval(checkReadyStateInterval);
                                        _this.close();
                                    }
                                }, 60);
                            }
                        }
                        else
                        {
                            this.close();
                        }
                    }
                    else
                    {
                        this.options.onCancel();
                    }
                }.bind(this));

                if (!checkExists(SourceCode.Forms.Widget.PopupWindow.headerButtonCloseWidth))
                    SourceCode.Forms.Widget.PopupWindow.headerButtonCloseWidth = _closeButton.outerWidth(true);
                buttonSizes += SourceCode.Forms.Widget.PopupWindow.headerButtonCloseWidth;

                // Setting group styling
                if (window.ie)
                {
                    var _children = _headerButtons.children();

                    if (_children.length > 1)
                    {
                        for (var i = 0; i < _children.length; i++)
                        {
                            if (i === 0) jQuery(_children[i]).addClass("first");
                            if (i !== 0 && i === (_children.length - 1)) jQuery(_children[i]).addClass("last");
                        }
                    } else
                    {
                        jQuery(_children[0]).addClass("only");
                    }
                }
            }
            if (document.documentElement.getAttribute("dir") === "rtl")
            {
                this.controls.header.find('.popup-header-text')[0].style.left = buttonSizes + "px";
            }
            else
            {
                this.controls.header.find('.popup-header-text')[0].style.right = buttonSizes + "px";
            }
        },

        //TFS 795456 - Function added as a check for URLs that are being navigated to ie. not Subforms or Subforms
        //Or initially a subform/subview is loaded up and then a URL loaded in the frame.
        //Remember to change the equivalent function SourceCode.Forms.Runtime.getPopupIframeContentWindow in Helper.js
        _getPopupIframeContentWindow: function (popupIframe)
        {

            if (checkExists(popupIframe) && (popupIframe.length > 0) && (popupIframe.hasClass("navigated") === false))
            {
                var innerWindow = popupIframe[0].contentWindow;
                if (checkExists(innerWindow))
                {
                    return innerWindow;
                }
            }
            return null;
        },

        focusLastFocussed: function ()
        {
            var popups = $.popupManager.popUps;
            var elementsToFocusCollection = $.popupManager.elementsToFocusCollection;
            var popupLength = popups.length;


            if (popupLength > 0 && checkExists(elementsToFocusCollection) && elementsToFocusCollection.length > 0)
            {
                var lastFocus = elementsToFocusCollection.pop();
                if (checkExists(lastFocus) && lastFocus.length > 0)
                {
                    if (SourceCode.Forms.Browser.msie)
                    {
                        //Fix for TFS 472180 Ticket #60588
                        //the browser keeps focus on the incorrect window when focused iframes are removed
                        //this prevents elements from being focused when popups are closed
                        //related issue in jquery UI http://bugs.jqueryui.com/ticket/9122
                        if (checkExists(this.controls) && checkExists(this.controls.main) && this.controls.main.find("iframe").length > 0)
                        {
                            var temporaryTextBox = null;

                            try
                            {
                                if (checkExists(lastFocus[0].ownerDocument))
                                {
                                    var locationDocument = $(lastFocus[0].ownerDocument);
                                    temporaryTextBox = locationDocument.find(".temporaryFocusingTextBox");

                                    if (temporaryTextBox === null || temporaryTextBox.length === 0)
                                    {
                                        temporaryTextBox = $('<input type="text" class="temporaryFocusingTextBox" style="position:absolute;left:-100px;width:1px;height:1px;"/>').appendTo("body");
                                    }
                                    else
                                    {
                                        temporaryTextBox.show();
                                    }
                                    //if the owner document can't be found, the new element can't be repositioned using insertAfter - TFS572524
                                    temporaryTextBox.insertAfter(lastFocus).trigger("focus").hide();
                                }
                            }
                            catch (exc)
                            {
                                //handles permission issue with asynchronously opening popups TFS570859
                                return;
                            }
                            //end Fix for TFS 472180 Ticket #60588
                        }
                        else
                        {
                            //if the browser is IE8 the iframe is focused first and not the last focus
                            //this code corrects this in a simplier way to the above
                            if (SourceCode.Forms.Browser.version <= 8)
                            {
                                var body = $("body");
                                body.on("focusin.lastFocus", function ()
                                {
                                    body.off("focusin.lastFocus");
                                    lastFocus.trigger("focus");
                                });
                            }
                        }
                    }
                    //execute standard simple focus for all browsers
                    lastFocus.trigger("focus");
                }
            }
        },

        doubleClickMaximise: function (ev)
        {
            var target = jQuery(ev.target).parent().find(".maximize,.restore");
            this._maximise(target);
        },

        maximise: function (event)
        {
            var target = (jQuery(event.target)[0].tagName.toLowerCase() === "a") ? jQuery(event.target) : jQuery(event.target.parentNode);
            this._maximise(target);
        },

        _maximise: function (target)
        {
            if (target.hasClass("maximize"))
            {
                target.removeClass("maximize");
                target.addClass("restore");
                target[0].title = Resources.CommonActions.Minimize;
                this.maximize();
                if (this.options.draggable === true)
                    this.controls.main.SFCPopupdraggable("disable");
            } else
            {
                target.removeClass("restore");
                target.addClass("maximize");
                target[0].title = Resources.CommonActions.Maximize;
                this.restore();
                if (this.options.draggable === true)
                    this.controls.main.SFCPopupdraggable("enable");
            }

            target.trigger("blur");
        },

        minimize: function (event)
        {
            var target = (jQuery(ev.target)[0].tagName.toLowerCase() === "a") ? jQuery(ev.target) : jQuery(ev.target.parentNode);
            this._minimize(target);
        },

        _minimize: function (target)
        {
            if (target.hasClass("minimize"))
            {
                target.removeClass("minimize");
                target.addClass("restore");
                this.minimize();
            } else
            {
                target.removeClass("restore");
                target.addClass("minimize");
                this.restore();
            }

            target.trigger("blur");
        },

        //show
        show: function ()
        {
            this.controls.main.addClass("intro");
            this.controls.main.show();

            $.popupManager.refreshPriorPopupsForIE();

            if (this.options.onShow)
                this.options.onShow(this);
            this.visible = true;
            if (this.options.maximized)
                this.maximize();

            //Find the last button in the popup's button bar and put focus on it.
            if ($(".popup").last().find(".popup-footer .button").length === 1)
                $(".popup").last().find(".popup-footer .button").eq(0).trigger("focus");
            else
                if ($(".popup").last().find(".popup-footer .button").length === 2)
                    $(".popup").last().find(".popup-footer .button").eq(0).trigger("focus");
                else
                    if ($(".popup").last().find(".popup-footer .button").length === 3)
                        $(".popup").last().find(".popup-footer .button").eq(1).trigger("focus");

            SourceCode.Forms.Widget.createUnderlay(this.element);
            //LG: Added animation intro for dialogs.
            this.controls.main.removeClass("intro");

            return this;
        },

        //hide
        hide: function ()
        {
            $this = this;

            if (!SourceCode.Forms.Layout.useAnimationsOnPopupClosing()
                || !SourceCode.Forms.Layout.useAnimations()
                || SourceCode.Forms.Layout.isRuntime())
            {
                $this.controls.main.hide();
                $this.visible = false;
                if ($this.options.onHide) $this.options.onHide();
            }
            else
            {
                $this.controls.main.find(".popup-closing-modal").removeClass("hidden");
                $this.controls.main.addClassTransition("exit", function ()
                {
                    $this.controls.main.hide();
                    $this.visible = false;
                    if ($this.options.onHide) $this.options.onHide();
                    $(this).removeClass("exit intro");
                    $(this).find(".popup-closing-modal").addClass("hidden");
                }, ".popup");
            }

            return this;
        },

        //close
        /*
        options.removeContent undefined	& closeOptions.removeContent undefined	-> removeContent: false
        options.removeContent undefined	& closeOptions.removeContent false        -> removeContent: false
        options.removeContent undefined	& closeOptions.removeContent true        -> removeContent: true
        options.removeContent false        & closeOptions.removeContent undefined	-> removeContent: false
        options.removeContent false        & closeOptions.removeContent false        -> removeContent: false
        options.removeContent false        & closeOptions.removeContent true        -> removeContent: true
        options.removeContent true        & closeOptions.removeContent undefined	-> removeContent: true
        options.removeContent true        & closeOptions.removeContent false        -> removeContent: false
        options.removeContent true        & closeOptions.removeContent true        -> removeContent: true
        */
        close: function (pCloseOptions)
        {
            if (SourceCode.Forms.Layout.isRuntime())
            {
                this.isClosing = true; //runtime requires isClosing to be set here then manually calls closed
                restoreTabIndexes();
                this.focusLastFocussed();
            }

            //set defaults

            var _cancelClose = false; // _cancelClose determines if the closed method should be fired to close the popup window
            var _cancelOnClose = false; // _cancelOnClose determines if the OnClose event method should be fired
            var _removeContentOnClose = false; // _removeContentOnClose determines if the actual popup window content should be removed or not

            //get the orginal window options values
            if (checkExists(this.options))
            {
                if (checkExists(this.options.cancelClose))
                    _cancelClose = this.options.cancelClose;

                if (checkExists(this.options.cancelOnClose))
                    _cancelOnClose = this.options.cancelOnClose;

                if (checkExists(this.options.removeContentOnClose))
                    _removeContentOnClose = this.options.removeContentOnClose;
            }

            //pCloseOptions override the original popup options
            if (typeof pCloseOptions !== "undefined")
            {
                if (checkExists(pCloseOptions['cancelClose']))
                    _cancelClose = pCloseOptions['cancelClose'];

                if (checkExists(pCloseOptions['cancelOnClose']))
                    _cancelOnClose = pCloseOptions['cancelOnClose'];

                if (checkExists(pCloseOptions['removeContent']))
                    _removeContentOnClose = pCloseOptions['removeContent'];
            }

            if (_cancelOnClose !== true)
            {
                if (checkExists(this.options.onClose))
                    this.options.onClose(this, pCloseOptions);
            }
            if (_cancelClose !== true)
            {
                this.closed(pCloseOptions);
            }

            return this;
        },

        closed: function (pCloseOptions)
        {
            var _cancelOnClose;
            var _removeContentOnClose;

            if (typeof (pCloseOptions) !== "undefined" && pCloseOptions !== null)
            {
                _cancelOnClose = pCloseOptions['cancelOnClose'];
                _removeContentOnClose = pCloseOptions['removeContent'];
            }
            var _options = this['options'];
            var _preserveContent = typeof (_removeContentOnClose) === "undefined" ? _options['removeContent'] !== true : _removeContentOnClose === false;
            var _controls = this['controls'];

            if (_preserveContent)
            {
                var _content = _options['content'];

                if (typeof (_content) !== "undefined" && typeof _content !== 'string')
                {
                    var _firstChild = null;

                    if (this.options.showContentOnly)
                    {
                        _firstChild = _controls.main[0].firstChild;
                    }
                    else
                    {
                        _firstChild = _controls.body[0].firstChild.nextSibling.firstChild.firstChild.firstChild;
                    }

                    if (checkExists(_firstChild))
                    {
                        _firstChild.style.display = 'none';

                        document.body.appendChild(_firstChild);
                    }
                }
            }
            var _jqMain = _controls['main'];

            SourceCode.Forms.Widget.destroyUnderlay(this.element);

            // Prevent IE11 bug that makes the browser crash when calling elem.parentElement.removeChild(elem); TFS 500599
            //TFS 544810 - If the popup contains an iframe (most probably an subform/subview),
            //first remove the event handlers bound to the iframe window before removing the elements
            //to avoid js errors with Sys logic if a popup is closed immediately after if is opened
            var _controlsIframe = _jqMain.find("iframe");

            var windowToUse = this._getPopupIframeContentWindow(_controlsIframe);
            if ((windowToUse !== null) && (typeof $clearHandlers !== "undefined"))
            {
                $clearHandlers(windowToUse);

            }

            //fires when the close animation completes.
            function onFinishedClosingAnimation()
            {
                //Firefox: the destroy methods must only be called after the animation completes.
                //If they are called before the animation starts, the transitionend is not called, and so
                //this onFinishedClosingAnimation is not called to remove the underlay etc.
                if (_jqMain.isWidget("resizable")) _jqMain.resizable("destroy");
                if (_jqMain.isWidget("draggable")) _jqMain.draggable("destroy");
                _jqMain.hide();
                _jqMain.remove();

                $.popupManager._removePopup(this);

                var _lastModal = $.popupManager.getLastModal();
                if (_lastModal === undefined)
                {
                    if ($.popupManager.container.parent().css("position") === "relative")
                    {
                        $.popupManager.container.css({
                            "position": "static",
                            "top": "0px",
                            "left": "0px",
                            "width": "100%",
                            "height": "100%"
                        });
                    }
                }

                if (SourceCode.Forms.Browser.msie || SourceCode.Forms.Browser.edge)
                {
                    //Hack to allow IE 9 to keep up with us
                    //prevents the modal from staying on the screen
                    var $this = this;
                    setTimeout(function ()
                    {
                        //if previous last modal was closing, this would have resulted in an error 
                        //in the insertBefore statement below (TFS 227444)
                        var _lastModal = $.popupManager.getLastModal();
                        if (_lastModal === undefined)
                        {

                            $this.hideModalizer();
                        }
                        else
                        {
                            //TFS 753144, 754708
                            //When closing multiple popups, onFinishedClosingAnimation will be stacked due to the async nature of animation transition when closing popups. 
                            //And if it happens to be the last popup, we need to perform exit animation for the modalizer.  
                            //If the modalzier somehow is reposition, the transition will halt and causing the transitionend event not been trigger to hide the modalizer and blocking the user. 
                            //So when there are popups been closing we don't want to reposition the modalizer to avoid conflicting with the modalizer exit animation.
                            if (!SourceCode.Forms.Layout.useAnimationsOnPopupClosing()
                                || !SourceCode.Forms.Layout.useAnimations()
                                || SourceCode.Forms.Layout.isRuntime()
                                || popupManager.hasClosingPopups() === false)
                            {
                                var controls = _lastModal['controls'];
                                var jqMain = controls['main'];

                                $(modalizer['element']).insertBefore($(jqMain[0]));
                            }
                        }
                    }.bind(this), 0);
                }
                else
                {
                    if (_lastModal === undefined)
                    {
                        this.hideModalizer();
                    }
                    else
                    {
                        var controls = _lastModal['controls'];
                        var jqMain = controls['main'];

                        //TFS 753144, 754708
                        //When closing multiple popups, onFinishedClosingAnimation will be stacked due to the async nature of animation transition when closing popups. 
                        //And if it happens to be the last popup, we need to perform exit animation for the modalizer.  
                        //If the modalzier somehow is reposition, the transition will halt and causing the transitionend event not been trigger to hide the modalizer and blocking the user. 
                        //So when there are popups been closing we don't want to reposition the modalizer to avoid conflicting with the modalizer exit animation.
                        if (!SourceCode.Forms.Layout.useAnimationsOnPopupClosing()
                            || !SourceCode.Forms.Layout.useAnimations()
                            || SourceCode.Forms.Layout.isRuntime()
                            || popupManager.hasClosingPopups() === false)
                        {
                            $(modalizer['element']).insertBefore($(jqMain[0]));
                        }
                    }
                } //end of onFinishedClosingAnimation
            }

            //LG: Complete the close animation and cleanup
            //Only do the animations in design time - runtime forms must continue to work as normal.
            if (!SourceCode.Forms.Layout.useAnimationsOnPopupClosing()
                || !SourceCode.Forms.Layout.useAnimations()
                || SourceCode.Forms.Layout.isRuntime())
            {
                onFinishedClosingAnimation.call(this);
            }
            else
            {
                _jqMain.find(".popup-closing-modal").removeClass("hidden");
                _jqMain.addClassTransition("exit", function ()
                {
                    onFinishedClosingAnimation.call(this); //do the cleanup
                    _jqMain.removeClass("exit intro");
                    _jqMain.find(".popup-closing-modal").addClass("hidden");
                }.bind(this), ".popup");
            }

            //designtime requires isClosed to be set here TFS 769711 / 769621
            //since in many places we call closeLast incorrectly from onClose
            //with the expectation that the same / current popup is returned
            this.isClosed = true;

            return this;
        },

        isOpen: function ()
        {
            return !this.isClosed && !this.isClosing;
        },

        hideModalizer: function (callback)
        {
            var jqmodalizer = $(modalizer['element']);

            //animate in design-time only.
            if (!SourceCode.Forms.Layout.useAnimationsOnPopupClosing()
                || !SourceCode.Forms.Layout.useAnimations()
                || SourceCode.Forms.Layout.isRuntime())
            {
                modalizer.hide();
                if (typeof (callback) == "function") callback();
            }
            else
            {
                jqmodalizer.addClassTransition("exit", function ()
                {
                    modalizer.hide();
                    jqmodalizer.removeClass("intro exit");
                    if (typeof (callback) == "function") callback();
                }, ".modalizer");
            }
        },

        //maximize
        maximize: function ()
        {
            this.options.maximized = null;

            this._restore.width = this.controls.main.width();
            this._restore.height = this.controls.main.height();
            this._restore.left = this.controls.main.offset().left;
            this._restore.top = this.controls.main.offset().top;

            var jqWindow = jQuery(window);

            var minimumTop = 5;
            var minimumLeft = 5;
            var minimumTopAndBottom = (minimumTop * 2);
            var minimumLeftAndRight = (minimumLeft * 2);

            var top = jqWindow.scrollTop() + minimumTop;
            var left = jqWindow.scrollLeft() + minimumLeft;

            top = (top < minimumTop) ? minimumTop : top;
            left = (left < minimumLeft) ? minimumLeft : left;

            this.controls.main[0].style.top = (top) + "px";
            this.controls.main[0].style.left = (left) + "px";
            this.controls.main[0].style.height = (jqWindow.height() - minimumTopAndBottom) + "px";
            this.controls.main[0].style.width = (jqWindow.width() - minimumLeftAndRight) + "px";

            var _height = this.controls.main.height() - this.controls.header.height() - this.controls.footer.height();
            var _jqMaximize = jQuery(this.controls.header).find("a.maximize").eq(0);

            _jqMaximize.removeClass("maximize");
            _jqMaximize.addClass("restore");

            this.controls.main.addClass("maximized");

            if (this.options.onMaximize)
            {
                this.options.onMaximize();
            }

            return this;
        },

        //restore
        restore: function ()
        {
            this.controls.main.css({
                'top': this._restore.top + 'px',
                'left': this._restore.left + 'px',
                'height': this._restore.height + 'px',
                'width': this._restore.width + 'px'
            });

            var _height = this.controls.main.height() - this.controls.header.height() - this.controls.footer.height();

            this.controls.main.removeClass("maximized");

            if (this.options.onRestore)
                this.options.onRestore();

            return this;
        },

        //minimize
        minimize: function ()
        {
            this._restore.width = this.controls.main.width();
            this._restore.height = this.controls.main.height();
            this._restore.left = this.controls.main.offset().left;
            this._restore.top = this.controls.main.offset().top;

            // TODO
            if (this.options.onMinimize)
                this.options.onMinimize();

            return this;
        },

        //resize
        resize: function (width, height)
        {
            this.controls.main.css({
                'width': width + 'px',
                'height': height + 'px'
            });
            if (this.options.onResize)
                this.options.onResize();

            SourceCode.Forms.Widget.createUnderlay(this.controls.main);

            return this;
        },

        //move
        move: function (x, y)
        {
            this.controls.main.css({
                'left': x + 'px',
                'top': y + 'px'
            });

            SourceCode.Forms.Widget.createUnderlay(this.controls.main);

            return this;
        },

        //center
        center: function ()
        {

            if (!this.visible)
                this.controls.main.show();

            var windowScrollTop = jQuery(window).scrollTop();
            var outerWindowHeight = getWindowOuterHeight();
            var isMobile = ($('html.mobile').length > 0);
            if (isMobile)
            {
                //Zero checks are for IPad results that are always zero
                if (outerWindowHeight === 0)
                {
                    outerWindowHeight = window.screen.availHeight;
                }
                if (windowScrollTop === 0)
                {
                    windowScrollTop = -$('form')[0].getBoundingClientRect().top;
                }
            }
            var innerWindowHeight = getWindowInnerHeight();
            var top = 0;
            var left = 0;
            var popupBuffer = 10;

            var useAlternatePopupVerticalPositioning = null;
            switch (this.options.subformVerticalAlign)
            {
                case 'middle':
                    //Disable AlternatePopupPositioning
                    useAlternatePopupVerticalPositioning = false;
                    break;
                case 'auto':
                    //Force Alternative popup positioning mode on Rules, unless disabled in Web.config (ignoring mobile)
                    useAlternatePopupVerticalPositioning = !evalCommon("SourceCode.Forms.Settings.Compatibility.DisableAlternatePopupPositioningOnLargeiFrames");
                    break;
                default:
                    useAlternatePopupVerticalPositioning = !evalCommon("SourceCode.Forms.Settings.Compatibility.DisableAlternatePopupPositioningOnLargeiFrames") && isMobile;
            }
            
            if (useAlternatePopupVerticalPositioning && innerWindowHeight > outerWindowHeight) // on no! We're in a huge iframe!
            {
                var popupHeight = this.controls.main.height();

                var activeElement = null;

                try
                {
                    activeElement = document.activeElement;
                }
                catch (e)
                {
                    // active element doesn't exist. Do nothing, since it will default to null
                }

               if (this._isValidActiveElement(activeElement))
                {
                    top = $(activeElement).offset().top - (popupHeight / 2);
                }
                else
                {
                    top = ((innerWindowHeight - this.controls.main.height()) / 2) + windowScrollTop
                }

                // Different rules apply to iframes. When the user clicks on controls near the top of the page 
                // everything will render at the very top if we don't specify the 10px min.
                if (top < popupBuffer)
                {
                    top = popupBuffer;
                }

                if (top + popupHeight > innerWindowHeight) // Part of the popup is below the bottom of the page.
                {
                    top = innerWindowHeight - popupHeight - popupBuffer;
                }
            }
            else
            {
                top = ((innerWindowHeight - this.controls.main.height()) / 2) + windowScrollTop
            }

            left = ((jQuery(window).width() - this.controls.main.width()) / 2) + jQuery(window).scrollLeft();

            if (top < 0) top = 0; // Ensuring that the popup is never place outside the screen
            if (left < 0) left = 0; // Ensuring that the popup is never place outside the screen

            this.controls.main.css(
            {
                'top': (top) + 'px',
                'left': (left) + 'px'
            });

            if (!this.visible)
            {
                this.controls.main.hide();
            }

            return this;
        },

        _isValidActiveElement: function (activeElement)
        {
            return checkExists(activeElement) && checkExists(activeElement.tagName);
        },

        //addButton
        addButton: function (options)
        {
            this._ensureButtonBar();
            this.controls.mainbuttongroup.buttonGroup("addButtonFromOptions", options);
            return this;
        },

        getButtonBar: function ()
        {
            return this.controls.buttonbar;
        },

        getButtonById: function (buttonId)
        {
            return this.controls.buttonbar.find("#" + buttonId + ".button");
        },

        getButtonByType: function (buttonType)
        {
            return this.controls.buttonbar.find("." + buttonType + ".button");
        },

        //showBusy
        showBusy: function (pShowBusy)
        {
            if (!checkExists(pShowBusy))
            {
                pShowBusy = true;
            }

            var _divPopupBodyContent = this.controls.body.find("div.popup-body-content");

            _divPopupBodyContent.modalize(pShowBusy);
            _divPopupBodyContent.showBusy(pShowBusy);

            jQuery(this.controls.footer).find("a.button").each(function ()
            {
                jQuery(this).modalize(pShowBusy);
            });

            return this;
        },

        //hideBusy
        hideBusy: function ()
        {
            this.showBusy(false);

            return this;
        },

        _destroy: function ()
        {
            if (this.controls.main.isWidget("resizable"))
            {
                this.controls.main.resizable("destroy");
            }
        }
    };

    $.widget("ui.popupwindow", SourceCode.Forms.Widget.PopupWindow);

    /*
    ExtendedBox
    Displays a box that can contains a normal and an extended detail section
    */
    SourceCode.Forms.Widget.ExtendedBox = {
        //options
        options: {
            width: 640,
            height: 158,
            expandedWidth: 640,
            draggable: true,
            expandedHeight: 358,
            showHeaderButtons: false,
            isExpanded: false
        },

        //initialize
        _create: function ()
        {
            var uniqueId = String.generateGuid();
            this.options.buttons = [];
            if (this.options.messageDetail)
                this.options.buttons.push({
                    id: "btnExHandler_Details" + uniqueId,
                    text: Resources.CommonActions.Details,
                    click: this._toggleDetails.bind(this),
                    title: Resources.CommonActions.ExceptionInfo
                });

            if (this.options.onCancel)
            {
                this.options.buttons.push({
                    id: "ok" + uniqueId,
                    text: Resources.WizardButtons.OKButtonText,
                    click: !this.options.onAccept ? this.close.bind(this) : this.options.onAccept
                });
                this.options.buttons.push({
                    id: "cancel" + uniqueId,
                    text: Resources.WizardButtons.CancelButtonText,
                    click: !this.options.onCancel ? this.close.bind(this) : this.options.onCancel
                });

                if (!this._useRuntimeButtons())
                {
                    this.options.closeWith = "cancel" + uniqueId;
                }
            }
            else
            {
                this.options.buttons.push({
                    id: "ok" + uniqueId,
                    text: Resources.WizardButtons.OKButtonText,
                    click: !this.options.onAccept ? this.close.bind(this) : this.options.onAccept
                });
                if (!this._useRuntimeButtons())
                {
                    this.options.closeWith = "ok" + uniqueId;
                }
            }

            var panelWidth = this.options.expandedWidth - 73;
            var panelHeight = this.options.expandedHeight - this.options.height - 15;

            var panelClass = "panel without-header without-footer";

            if (SourceCode.Forms.Layout.isRuntime() || SourceCode.Forms.Layout.isLoginPage())
            {
                panelClass = panelClass + " full";
            }


            var _panelHTML = "<div id=\"ExceptionPanel\" class=\"{0}\">".format(panelClass)
                + "<div class=\"panel-body\"><div class=\"panel-body-t\"><div class=\"panel-body-t-l\"></div><div class=\"panel-body-t-c\">"
                + "</div><div class=\"panel-body-t-r\"></div></div><div class=\"panel-body-m\"><div class=\"panel-body-m-l\"></div>"
                + "<div class=\"panel-body-m-c\"><div class=\"wrapper\"><div class=\"scroll-wrapper\"><div class=\"lyt-messagebox-layout\" id=\"exMessage\">"
                + "<div class=\"icon\"></div><div class=\"message\">" + this.options.message + "</div></div>";
            if (this.options.messageDetail)
                _panelHTML += "<div id=\"exDivider\"></div><div id=\"exDetails\" style=\"display: none;\" class=\"exceptionDetails\"><ul class=\"tree\">" + this.options.messageDetail + "</div>";
            _panelHTML += "</div></div></div><div class=\"panel-body-m-r\"></div></div><div class=\"panel-body-b\"><div class=\"panel-body-b-l\"></div><div class=\"panel-body-b-c\"></div><div class=\"panel-body-b-r\"></div></div></div></div>";

            this.options.content = _panelHTML;
            $.ui.popupwindow.prototype._create.apply(this, arguments);

            var div = jQuery(this.controls.body).find("div.popup-body-content > div.scroll-wrapper").addClass("message-box-content");
            if (this.options.type)
                div.addClass(this.options.type);
            if (this.options.isExpanded)
            {
                this.options.isExpanded = false;
                this._toggleDetails();
            }
        },
        _toggleDetails: function ()
        {
            this.options.isExpanded = !this.options.isExpanded;
            if (this.options.isExpanded)
            {

                jQuery("#exMessage").addClass("exceptionMessage");
                jQuery("#exDivider").addClass("exceptionDivider");
                jQuery("#exDetails").show();

                popupManager.getLastModal().resize(this.options.expandedWidth, this.options.expandedHeight).center();
            }
            else
            {
                jQuery("#exMessage").removeClass("exceptionMessage");
                jQuery("#exDivider").removeClass("exceptionDivider");
                jQuery("#exDetails").hide();

                popupManager.getLastModal().resize(this.options.width, this.options.height).center();
            }
        }
    };
    $.widget("ui.extendedbox", $.ui.popupwindow, SourceCode.Forms.Widget.ExtendedBox);

    /*
    MessageBox
    Displays a message box that can contain text, buttons, and symbols that inform and instruct the user.
    */
    var defaultMessageBoxHeight = 185;
    //defaultMessageBoxHeight is no longer used for warnings / info and confirmation dialogs in DT is overridden by CSS 
    //It is used in the login screen
    SourceCode.Forms.Widget.MessageBox = {
        //options
        options: {
            width: 384,
            draggable: true,
            height: defaultMessageBoxHeight,
            showHeaderButtons: false
        },

        //initialize
        _create: function ()
        {
            //this.setOptions(pOptions);


            var headerTemplate =
                "<div class=\"panel-header\"> \
                    <div class=\"panel-header-l\"></div> \
                    <div class=\"panel-header-c\"> \
                        <div class=\"panel-header-wrapper\"> \
                            <div class=\"panel-header-text\" title=\"{1}\">{0}</div> \
                        </div> \
                    </div> \
                    <div class=\"panel-header-r\"></div> \
                </div>";

            var contentTemplate =
             "<div class=\"panel {2} without-footer\"> \
                {1} \
                <div class=\"panel-body\"> \
                    <div class=\"panel-body-t\"> \
                        <div class=\"panel-body-t-l\"></div> \
                        <div class=\"panel-body-t-c\"></div> \
                        <div class=\"panel-body-t-r\"></div> \
                    </div> \
                    <div class=\"panel-body-m\"> \
                        <div class=\"panel-body-m-l\"></div> \
                        <div class=\"panel-body-m-c\"> \
                            <div class=\"scroll-wrapper\"> \
                                <div class=\"lyt-messagebox-layout\"> \
                                    <div class=\"icon\"></div> \
                                    <div class=\"message\">{0}</div> \
                                </div> \
                            </div> \
                        </div> \
                        <div class=\"panel-body-m-r\"></div> \
                    </div> \
                    <div class=\"panel-body-b\"> \
                        <div class=\"panel-body-b-l\"></div> \
                        <div class=\"panel-body-b-c\"></div> \
                        <div class=\"panel-body-b-r\"></div> \
                    </div> \
                </div> \
            </div>";

            if (!checkExists(this.options) || !checkExists(this.options.buttons))
            {
                var _id = "messageBoxButton_OK" + new Date().getTime();

                this.options.buttons = [{ id: _id, text: Resources.WizardButtons.OKButtonText }];
                if (this._useRuntimeButtons())
                {
                    this.options.buttons[0].click = this.close.bind(this);
                }
                else
                {
                    this.options.closeWith = _id;
                }
            }
            var panelHeaderElements = "";
            var panelHeaderStyle = "without-header ";

            if (checkExists(this.options.title)) //add the panel header elements and adjust the relevant classes
            {
                panelHeaderElements = headerTemplate.replace("{0}", this.options.title).replace("{1}", this.options.title.htmlEncode());
                panelHeaderStyle = "";
            }

            if (SourceCode.Forms.Layout.isRuntime() || SourceCode.Forms.Layout.isLoginPage())
            {
                panelHeaderStyle = panelHeaderStyle + " full";
            }

            this.options.content = contentTemplate.replace("{0}", this.options.message).replace("{1}", panelHeaderElements).replace("{2}", panelHeaderStyle);
            $.ui.popupwindow.prototype._create.apply(this, arguments);

            jQuery(this.controls.body).find("div.popup-body-content > div.scroll-wrapper").addClass("message-box-content");
            if (checkExists(this.options.type))
            {
                jQuery(this.controls.body).find("div.popup-body-content > div.scroll-wrapper").addClass(this.options.type);
            }


        }
    };
    $.widget("ui.messagebox", $.ui.popupwindow, SourceCode.Forms.Widget.MessageBox);

    /* NotificationBox */
    SourceCode.Forms.Widget.NotificationBox =
    {
        //initialize
        _create: function ()
        {
            //this.setOptions(pOptions);
            if (!checkExists(this.options) || !checkExists(this.options.headerText))
            {
                this.options.headerText = Resources.MessageBox.Notification;
            }

            $.ui.messagebox.prototype._create.apply(this, arguments);
            jQuery(this.controls.body).find("div.popup-body-content > div.scroll-wrapper").addClass("info");
        }
    };
    $.widget("ui.notificationbox", $.ui.messagebox, SourceCode.Forms.Widget.NotificationBox);

    /* WarningBox */
    SourceCode.Forms.Widget.WarningBox =
    {
        //initialize
        _create: function ()
        {
            // this.setOptions(pOptions);
            this.options.headerText = Resources.MessageBox.Warning;
            $.ui.messagebox.prototype._create.apply(this, arguments);
            jQuery(this.controls.body).find("div.popup-body-content > div.scroll-wrapper").addClass("warning");
        }
    };
    $.widget("ui.warningbox", $.ui.messagebox, SourceCode.Forms.Widget.WarningBox);

    /* ConfirmationBox */
    SourceCode.Forms.Widget.ConfirmationBox =
    {
        //initialize
        /*
        Button groupings:
        Yes|No (default)
        Yes|No|Cancel
        OK|Cancel

        (Required)
        onAccept: Yes|OK callback

        (Optional)
        onCancel: Cancel callback
        onDecline: No callback
        */
        _create: function ()
        {
            var _resources = Resources.MessageBox;

            var options = this.options; //this.setOptions(options).options;

            !options.headerText && (options.headerText = _resources.Confirmation);

            var _acceptButton = {
                click: options.onAccept
            };

            var _buttons = [_acceptButton];

            if (!options.onCancel || !!options.onDecline)
            {
                _acceptButton.text = _resources.YesButtonText;

                _buttons.push({
                    click: !options.onDecline ? function () { this.close.apply(this, [].slice(arguments)); }.bind(this) : options.onDecline,
                    text: _resources.NoButtonText
                });

                if (!!options.onCancel)
                    _buttons.push({
                        click: options.onCancel,
                        text: _resources.CancelButtonText
                    });
            }
            else
            {
                _acceptButton.text = _resources.OKButtonText;

                _buttons.push({
                    click: options.onCancel,
                    text: _resources.CancelButtonText
                });
            }

            options.buttons = _buttons;

            $.ui.messagebox.prototype._create.apply(this, arguments);

            if (checkExistsNotEmpty(options.iconClass))
            {
                jQuery(this.controls.body).find("div.popup-body-content > div.scroll-wrapper").addClass(options.iconClass);
            }
            else
            {
                jQuery(this.controls.body).find('.popup-body-content').find('.scroll-wrapper').eq(0).addClass(options.type || 'confirmation');
            }
        }
    };
    $.widget("ui.confirmationbox", $.ui.messagebox, SourceCode.Forms.Widget.ConfirmationBox);

    /* ErrorBox */
    SourceCode.Forms.Widget.ErrorBox =
    {
        //initialize
        _create: function ()
        {
            // this.setOptions(pOptions);
            this.options.headerText = Resources.MessageBox.Error;
            $.ui.messagebox.prototype._create.apply(this, arguments);

            jQuery(this.controls.body).find("div.popup-body-content > div.scroll-wrapper").addClass("error");
        }
    };
    $.widget("ui.errorbox", $.ui.messagebox, SourceCode.Forms.Widget.ErrorBox);

    /**
    * Creates or retrieves an underlying iframe for a given container.
    * This is used to prevent popups appearing behind ActiveX controls in IE.
    *
    * @method createUnderlay
    *
    * @param {Object} element A jQuery object containing an element.
    *
    * @return {Object} A jQuery object containing the source element.
    */
    SourceCode.Forms.Widget.getBoxShadow = function (element)
    {
        var result =
                {
                    hShadow: 0,
                    vShadow: 0,
                    blur: 0,
                    spread: 0
                };

        var boxShadow = element.css('box-shadow');
        if (checkExistsNotEmpty(boxShadow) && boxShadow !== 'none')
        {
            // Remove all possible color definitions
            boxShadow = boxShadow.replace(/rgba?\([^\)]+\)/gi, '');
            boxShadow = boxShadow.replace(/#[0-9a-f]+/gi, '');

            // Remove any alpha characters
            boxShadow = boxShadow.replace(/[a-z]+/gi, '').trim();

            // fn to get the value from an array index as an int.
            var getValueAsInt = function (source, index)
            {
                var val = source[index];
                if (typeof val === 'undefined')
                {
                    return 0;
                }

                return parseInt(source[index]);
            };

            // Split and get the different sizes
            var parts = boxShadow.split(' '),
                result =
                {
                    hShadow: getValueAsInt(parts, 0),
                    vShadow: getValueAsInt(parts, 1),
                    blur: getValueAsInt(parts, 2),
                    spread: getValueAsInt(parts, 3)
                };
        }
        return result;
    }

    SourceCode.Forms.Widget.fixPosition = function (ui)
    {
        if ($(window).scrollTop() > 0) //fix only necessary if scrollbar position has been adjusted
        {
            var correctTopPosition = ui.offset.top;
            var position = ui.position;
            if (position.top > correctTopPosition)
            {
                position.top = correctTopPosition;
            }
            ui.position = position;
        }
    }

    SourceCode.Forms.Widget.createUnderlay = function (element)
    {
        if (!SourceCode.Forms.Browser.msie)
        {
            return;
        }

        var attr =
            {
                width: element[0].offsetWidth,
                height: element[0].offsetHeight,
                frameborder: 0,
                src: 'about:blank'
            },
            offset = element.position(),
            style =
            {
                position: 'absolute',
                top: offset.top + 'px',
                left: offset.left + 'px',
                display: element[0].style.display === 'none' ? 'none' : 'block',
                filter: 'Alpha(Opacity="0")'
            },
            zIndex = element[0].style.zIndex;

        // If there is a set z-index, position the underlay one level below it
        if (zIndex.length > 0)
        {
            style.zIndex = parseInt(zIndex) - 1;
        }

        // NB: UI overlap is noticible without this
        // Get box-shadow property value
        var shadow = SourceCode.Forms.Widget.getBoxShadow(element);

        // Cater for calendars by testing the first child element
        if (!shadow)
        {
            shadow = SourceCode.Forms.Widget.getBoxShadow($(element[0].firstChild));
        }

        // If this is a dialog window, the box-shadow is on the '.popup-body' child element
        var popupBody = element.children('.popup-body');
        if (popupBody.length > 0)
        {
            shadow = SourceCode.Forms.Widget.getBoxShadow(popupBody);
        }

        if (shadow)
        {
            // Amend the dimensions to take into account the box-shadow
            attr.width += shadow.hShadow + shadow.spread;
            attr.height += shadow.vShadow + shadow.spread;
        }

        attr.width += 'px';
        attr.height += 'px';

        // Get the underlay element. Only insert a new one if one does not exist.
        // Apply the element attributes and position styles
        var underlay = (element.data('underlay') || $('<iframe></iframe>').insertBefore(element)),
            target = underlay[0];

        // Set attributes
        target.className = 'ie-underlay';
        target.setAttribute('width', attr.width);
        target.setAttribute('height', attr.height);
        target.setAttribute('frameborder', attr.frameborder);
        target.setAttribute('src', attr.src);

        // Set styles
        target.style.position = style.position;
        target.style.top = style.top;
        target.style.left = style.left;
        target.style.display = style.display;
        target.style.filter = style.filter;
        if (checkExists(style.zIndex))
        {
            target.style.zIndex = style.zIndex;
        }

        // Update the element's data to reference the underlaying element
        element.data('underlay', underlay);

        // Return element for chaining
        return element;
    };

    /**
    * Destroys an underlying iframe for a given container.
    *
    * @method destroyUnderlay
    *
    * @param {Object} element A jQuery object containing an element.
    */
    SourceCode.Forms.Widget.destroyUnderlay = function (element)
    {
        var underlay = element.data('underlay');

        // Check if the underlay exists
        if (typeof underlay === 'undefined')
        {
            return;
        }

        // And remove it
        underlay.remove();
        element.removeData('underlay');
    };
})(jQuery);

var popupManager = jQuery.popupManager;
var masterPopupManager = popupManager;
