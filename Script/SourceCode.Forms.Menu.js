var MenuBar = function (options)
{
    this.initialize(options);
};
var _MenuBarPrototype = {

    options: {
        element: null,
        container: null,
        buttons: [],
        target: "",
        id: "",
        hideURIs: false,
        dropshadow: false,
        onLoadError: null,
        onClick: null
    },

    initialize: function (options)
    {
        this.options = $.extend({}, this.options, options);
        this.element = null;
        this.buttons = [];
        this.id = this.options.id;
        this.target = this.options.target;
        this.hideURIs = this.options.hideURIs;
        this.activeButton = null;
        this.dropshadow = this.options.dropshadow;
        this.loading = false;

        if ($chk(this.options.element))
        {
            // Adopt the element as a menu bar
            this._adopt(this.options.element);
        } else
        {
            // Create the menu bar elements
            this._build();
        }
        $("body").on('mousedown.menu-bar', function (event) { this.resetMenuBar(event); }.bind(this));
    },

    _build: function ()
    {
        this.element = $("<div class='menu-bar'></div>"); //THE MOO new Element("div", {"class":"menu-bar"});
        if ($chk(this.id) && this.id !== "") this.element[0].id = this.id;
        this.element.html('<div class="menu-bar-wrapper"></div>');
        if ($chk(this.options.container)) this.options.container.appendChild(this.element[0]);
    },

    _adopt: function (element)
    {
        element = ($type(element) === 'string') ? $("#" + element) : (element.jquery) ? element : $(element);
        if (!element.hasClass("menu-bar")) return null;

        this.element = element;

        if (this.element[0].id !== "") this.id = this.element[0].id;

        this.element.children()[0].find('a.menu-bar-button').each(function (el) { this.addButton({ element: el }); }.bind(this));
    },

    addButton: function (options)
    {
        var newButton = new MenuBarButton($merge(options, { control: this, target: this.target }));

        if (newButton !== null) this.buttons.push(newButton);

        return newButton;
    },

    resetMenuBar: function (event)
    {
        if (this.activeButton === null) return;
        if (!event) event = new Event(event);
        var trgt = $(event.target);
        if (trgt === this.activeButton.element
            || trgt.parent() === this.activeButton.element
            || trgt.parent().parent() === this.activeButton.element
            || trgt.parent().parent() === this.activeButton.element) return;

        if (trgt.closest('.menu-bar').length > 0 || trgt.closest('.menu').length === 0)
        {
            this.activeButton.resetButton();
            this.activeButton = null;
        }
    },

    load: function (options)
    {

        if (this.loading) return;
        this.loading = true;

        if ($chk(options.xml))
        {
            // If an XML Document has been passed
            var xDoc = null;
            if ($type(options.xml) === "string")
            {
                // XML was passed as a string
                xDoc = parseXML(options.xml);
            } else
            {
                // XML was passed as an XML Document
                xDoc = options.xml;
            }

            this._import(xDoc.documentElement);

        } else if ($chk(options.url))
        {
            // A url was passed
            $this = this;
            var ajaxOptions =
            {
                url: options.url,
                type: options.method.toUpperCase() || 'GET',
                data: options.vars,
                cache: false,
                dataType: "xml",
                success: function (data, textStatus) { $this._load(data, textStatus); },
                error: function (data, textStatus) { $this._loadError(data, textStatus); }
            };
            //options.vars
            $.ajax(ajaxOptions);
        }

    },

    _load: function (xml, text)
    {

        if (xml !== null && xml.documentElement !== null)
        {
            this._import(xml.documentElement);
        } else
        {
            this._import(parseXML(text).documentElement);
        }

        this.loading = false;

    },

    _import: function (e)
    {

        var n = e.childNodes;
        for (var i = 0; i < n.length; i++)
        {
            if (n[i].tagName === 'node')
            {
                var opt = {};
                var a = n[i].attributes;
                for (var t = 0; t < a.length; t++)
                {
                    switch (a[t].name)
                    {
                    case 'text':
                    case 'id':
                    case 'icon':
                    case 'description':
                    case 'location':
                    case 'target':
                        opt[a[t].name] = a[t].value;
                        break;
                    }
                }

                var button = this.addButton(opt);

                // recursively import subnodes of this node:
                if (n[i].childNodes.length)
                {
                    var menu = button.addMenu({});
                    menu._import(n[i]);
                }
            }
        }

    },

    _loadError: function (xml, text)
    {
        this.loading = false;
        if (this.options.onLoadError)
            this.options.onLoadError(this, text, xml);
        // this.fireEvent('onLoadError', [this, text, xml]);
        //this.control.fireEvent('onLoadError', [this, text, xml]);
    }

};
$.extend(MenuBar.prototype, _MenuBarPrototype);

var MenuBarButton = function (options)
{
    this.initialize(options);
};
var _MenuBarButtonPrototype = {

    options: {
        id: "",
        element: null,
        control: null,
        text: "",
        location: "",
        target: "",
        description: "",
        hideURIs: false,
        onClick: null
    },

    initialize: function (options)
    {

        this.options = $.extend({}, this.options, options);
        this.element = null;
        this.control = this.options.control;
        this.target = this.options.target;
        this.id = this.options.id;
        this.text = this.options.text;
        this.description = this.options.description;
        this.location = this.options.location;
        this.hideURIs = this.options.hideURIs;

        this.menu = null;

        if ($chk(this.options.element))
        {
            // Adopt the element as a menu bar button
            this._adopt(this.options.element);
        } else
        {
            // Create the menu bar button element
            this._build();
        }

        this.element.on('click.menu-bar-button', this._click.bind(this));
        this.element.on('click.menu-bar-button', this.buttonClick.bind(this));
        this.element.on('mouseover.menu-bar-button', this.buttonMouseOver.bind(this));
    },

    _build: function ()
    {

        var href = ($chk(this.location) && this.location !== "") ? this.location : "javascript:;";

        this.element = $("<a href='" + href + "' class='menu-bar-button'></a>");
        this.element.html('<span class="menu-bar-button-wrapper"><span class="menu-bar-button-text">' + this.text + '</span></span>');
        //THE MOO new Element("a", {
        //            "href": href,
        //            "class": "menu-bar-button"
        //        }).setHTML('<span class="menu-bar-button-wrapper"><span class="menu-bar-button-text">' + this.text + '</span></span>');

        if ($chk(this.id) && this.id !== "") this.element[0].id = this.id;

        if ($chk(this.control.element)) $(this.control.element.children()[0]).append(this.element);

        if ($chk(this.target) && this.target !== "")
        {
            this.element.attr("target", this.target);
        } else if ($chk(this.control.target) && this.control.target !== "")
        {
            this.element.attr("target", this.control.target);
        }

        if ($chk(this.description) && this.description !== "") this.element.attr("title", this.options.description);

        if (this.hideURIs || this.control.hideURIs)
        {

            this.element.on('mouseenter.menu-bar-button', function () { window.status = this.text; }.bind(this));
            this.element.on('mouseleave.menu-bar-button', function () { window.status = ""; });

        }

    },

    _adopt: function (element)
    {

        element = ($type(element) === 'string') ? $("#" + element) : (element.jquery) ? element : $(element);
        if (!element.hasClass("menu-bar-button")) return null;

        this.element = element;

        if (this.element[0].id !== "") this.id = this.element[0].id;

        if (this.element[0].href !== "javascript:;") this.location = this.element[0].href;

        if (this.element.attr("title") !== "") this.description = this.element.attr("title");
        if (this.element.attr("target") !== "") this.target = this.element.attr("target");

        this.text = this.element.find('.menu-bar-button-text').text();

    },

    _click: function (event)
    {

        if (this.element[0].href !== "javascript:;")
        {
            var elTarget = $(this.element).attr("target");

            if (elTarget)
            {
                switch (elTarget)
                {
                case "_blank":
                case "_self":
                case "_top":
                case "_parent":
                    break;
                default:
                    if (elTarget !== null && elTarget !== "")
                    {
                        window.frames[elTarget].location = this.element[0].href;
                    }
                    else
                    {
                        window.location = this.element[0].href;
                    }
                    break;
                }
            }
        }

        if (this.options.onClick)
            this.options.onClick(event, this);
        //this.control.trigger("click");
        //        this.fireEvent('onClick', [event, this]);
        //        this.control.fireEvent('onClick', [event, this]);

    },

    addMenu: function (options)
    {

        var newMenu = new Menu($merge(options, { control: this, dropshadow: this.control.dropshadow, target: this.target }));

        if (newMenu !== null) this.menu = newMenu;

        return newMenu;

    },

    resetButton: function ()
    {

        // Restore the menubar button to normal
        this.element.removeClass("active");

        // Before hiding the button's menu, hide the submenus
        if (this.menu !== null)
        {
            this.menu.closeSubMenu();
            this.menu.element.css("visibility", "hidden");

            if (this.menu.dropShadowElement !== null) this.menu.dropShadowElement.css("visibility", "hidden");

        }

    },

    buttonClick: function (event)
    {

        this.element.trigger("blur");

        if (this.control.activeButton !== null) this.control.activeButton.resetButton();

        if (this !== this.control.activeButton)
        {
            this.depressButton();
            this.control.activeButton = this;
        } else
        {
            this.control.activeButton = null;
        }

        return false;

    },

    depressButton: function ()
    {

        if (this.menu !== null)
        {
            var x, y;

            this.element.addClass("active");

            x = this.element.offset().left;
            y = this.element.offset().top + this.element.height();

            this.menu.element.css({
                "left": x + "px",
                "top": y + "px",
                "visibility": "visible"
            });

            if (this.menu.dropShadowElement !== null)
            {
                this.menu.dropShadowElement.css({
                    "left": (x + 3) + "px",
                    "top": (y + 3) + "px",
                    "width": this.menu.element.width(),
                    "height": this.menu.element.height(),
                    "visibility": "visible"
                });
            }
        }

    },

    buttonMouseOver: function (event)
    {

        if (this.control.activeButton !== null && this.control.activeButton !== this) this.buttonClick(event);

    }

};
$.extend(MenuBarButton.prototype, _MenuBarButtonPrototype);

var Menu = function (options)
{
    this.initialize(options);
};
var _MenuPrototype = {

    options: {
        id: "",
        element: null,
        target: "",
        control: null,
        dropshadow: false,
        cssClass: null
    },

    initialize: function (options)
    {

        this.options = $.extend({}, this.options, options);
        this.id = this.options.id;
        this.element = null;
        this.dropshadow = this.options.dropshadow;
        this.target = this.options.target;
        this.control = this.options.control;
        this.items = [];
        this.activeItem = null;
        this.dropShadowElement = null;

        if ($chk(this.options.element))
        {
            // Adopt the element as a menu
            this._adopt(this.options.element);
        } else
        {
            // Create the menu element
            this._build();
        }

        if (this.options.cssClass !== null && this.options.cssClass !== "")
        {
            this.element.addClass(this.options.cssClass);
        }

        this.element.on('mouseover.menu', this.menuMouseOver.bind(this));
        this.element.on("keydown.menu", "a", this._menuKeyDown.bind(this));
    },

    _build: function ()
    {

        this.element = $("<div class='menu'></div>");
        this.element.html('<ul></ul>'); //THE MOO new Element("div", {"class":"menu"}).setHTML('<ul></ul>');

        if ($chk(this.id) && this.id !== "") this.element[0].id = this.id;

        this.originalMaxHeight = ($(!!document.defaultView ? document.defaultView : document.parentWindow).height() - 10);

        $("body").append(this.element);
        this.element.css({
            "max-height": this.originalMaxHeight + "px",
            "overflow": "auto",
            "top": 0,
            "left": 0
        });

        if (this.dropshadow)
        {
            this.dropShadowElement = $("<div class='menu-shadow'></div>");
            this.element.before(this.dropShadowElement);
            //THE MOO new Element("div", { "class": "menu-shadow" }).injectBefore(this.element);
        }

    },

    _adopt: function (element)
    {
        element = ($type(element) === 'string') ? $("#" + element) : (element.jquery) ? element : $(element);
        if (!element.hasClass("menu")) return null;

        this.element = element;

        if (this.element[0].id !== "") this.id = this.element[0].id;

        this.element.children()[0].children().each(function (el)
        {

            this.addItem({ element: el });

        }.bind(this));

    },

    _import: function (e)
    {

        var n = e.childNodes;

        for (var i = 0; i < n.length; i++)
        {
            if (n[i].tagName === 'node')
            {

                if (n[i].attributes["type"] !== null && n[i].attributes["type"] === "seperator")
                {

                    this.addSeperator();

                } else
                {

                    var opt = {};
                    var a = n[i].attributes;
                    for (var t = 0; t < a.length; t++)
                    {
                        switch (a[t].name)
                        {
                        case 'text':
                        case 'id':
                        case 'icon':
                        case 'description':
                        case 'location':
                        case 'target':
                            opt[a[t].name] = a[t].value;
                            break;
                        }
                    }

                    var item = this.addItem(opt);

                    // recursively import subnodes of this node:
                    if (n[i].childNodes.length)
                    {
                        var submenu = item.addSubMenu({});
                        submenu._import(n[i]);
                    }

                }
            }
        }

    },

    addItem: function (options)
    {
        var newItem = null;
        if (typeof (options.checked) !== "undefined" && typeof (options.type) == "undefined") options.type = "checkbox";

        switch (options.type)
        {
        case "filter":
            newItem = new FilterCheckMenuItem($merge(options, { control: this, target: this.target }));
            break;
        case "radiobutton":
            newItem = new RadioMenuItem($merge(options, { control: this, target: this.target }));
            break;
        case "checkbox":
            newItem = new CheckMenuItem($merge(options, { control: this, target: this.target }));
            break;
        default:
            newItem = new MenuItem($merge(options, { control: this, target: this.target }));
            break;
        }

        if (newItem !== null) this.items.push(newItem);

        return newItem;

    },

    addSeperator: function ()
    {
        this.items.push(new MenuItemSeperator({ control: this }));
    },

    closeSubMenu: function ()
    {

        if (this.activeItem === null) return;

        // Recursively close sub menus
        if (this.activeItem.subMenu !== null)
        {

            this.activeItem.subMenu.closeSubMenu();

            this.activeItem.subMenu.element.css("visibility", "hidden");

            if (this.activeItem.subMenu.dropShadowElement !== null) this.activeItem.control.subMenu.dropShadowElement.css("visibility", "hidden");

        }

        $(this.activeItem.element.children()[0]).removeClass('active');
        this.activeItem = null;
    },

    menuMouseOver: function (event)
    {

        if (this.activeItem !== null) this.closeSubMenu();

    },

    _menuKeyDown: function (event)
    {
        var menuItems = this.element.find('li:not(.seperator)');
        var focusedItem = this.element.find('.active');
        var currentIndex = menuItems.index(focusedItem);
        var returnResult = true;
        switch (event.which)
        {
        case 37:
        case 39:
            returnResult = true;
            break;
        case 40:
            var nextItemIndex = currentIndex + 1;
            if (nextItemIndex >= menuItems.length)
            {
                nextItemIndex = menuItems.length - 1;
            }
            menuItems.removeClass('active');
            $(menuItems[nextItemIndex]).addClass('active').trigger('focus');
            returnResult = false;
            break;
        case 38:
            var prevItemIndex = currentIndex - 1;
            if (prevItemIndex < 0)
            {
                if (prevItemIndex === -2)
                {
                    //clicked in and started key arrow up should start from last item upwards
                    prevItemIndex = menuItems.length - 1;
                }
                else
                {
                    prevItemIndex = 0;
                }
            }
            menuItems.removeClass('active');
            $(menuItems[prevItemIndex]).addClass('active').trigger('focus');
            returnResult = false;
            break;
        case 32:
        case 13:
            focusedItem.trigger("click");
            returnResult = false;
            event.stopPropagation();
            break;
        case 27:
            this.closeMenu();
            focusedItem.trigger("blur");
            returnResult = false;
            event.stopPropagation();
            break;
        }
        return returnResult;
    },

    closeMenu: function ()
    {
        if (this.activeItem !== null) this.closeSubMenu();

        this.element.css("visibility", "hidden");

        if (this.dropShadowElement !== null) this.dropShadowElement.css("visibility", "hidden");

        $(this.element).trigger("close.contextmenu");
    },

    isOpen: function ()
    {
        return (this.element.css("visibility") === "visible");
    },

    afterMenuItemClick: function ()
    {
        this.closeMenu();
    }

};
$.extend(Menu.prototype, _MenuPrototype);

var MenuItem = function (options)
{
    this.initialize(options);
};
var _MenuItemPrototype = {

    options: {
        id: "",
        text: "",
        description: "",
        icon: "",
        location: "",
        target: "",
        hideURIs: false,
        onClick: null

    },

    initialize: function (options)
    {

        this.options = $.extend({}, this.options, options);
        this.element = null;
        this.control = this.options.control;
        this.target = this.options.target;
        this.id = this.options.id;
        this.text = this.options.text;
        this.description = this.options.description;
        this.icon = this.options.icon;
        this.location = this.options.location;
        this.hideURIs = this.options.hideURIs;


        this.subMenu = null;

        if ($chk(this.options.element))
        {
            // Adopt the element as a menu
            this._adopt(this.options.element);
        } else
        {
            // Create the menu element
            this._build();
        }

        $(this.element.children()[0]).on('click.menu-item', function (event) { this._click(event); }.bind(this));
        $(this.element.children()[0]).on('mouseover.menu-item', function (event) { this.menuItemMouseOver(event); }.bind(this));

    },

    _build: function ()
    {

        this.element = $('<li></li>'); //THE MOO new Element("li");

        this.element.html('<a class="menu-item" href="javascript:;"><span class="menu-item-icon"></span><span class="menu-item-text">' + (typeof this.text === "string" ? this.text.htmlEncode() : this.text) + '</span></a>');

        if ($chk(this.control.element)) $(this.control.element.children()[0]).append(this.element);

        if ($chk(this.id) && this.id !== "") this.element.children()[0].id = this.id;

        if ($chk(this.location) && this.location !== "") $(this.element.children()[0]).attr("href", this.location);

        if ($chk(this.icon) && this.icon !== "") $(this.element.children()[0]).addClass(this.icon);

        if ($chk(this.target) && this.target !== "")
        {
            $(this.element.children()[0]).attr("target", this.target);
        } else if ($chk(this.control.target) && this.control.target !== "")
        {
            $(this.element.children()[0]).attr("target", this.control.target);
        }

        if ($chk(this.description) && this.description !== "") $(this.element.children()[0]).attr("title", this.options.description);

    },

    _adopt: function (element)
    {
        element = ($type(element) === 'string') ? $("#" + element) : (element.jquery) ? element : $(element);
        if (element[0].tagName !== "li") return null;

        this.element = element;

        if (this.element.children()[0].id !== "") this.id = this.element.children()[0].id;

        if ($(this.element.children()[0]).attr("href") !== "javascript:;") this.location = $(this.element.children()[0]).attr("href");
        if ($(this.element.children()[0]).attr("target") !== "") this.target = $(this.element.children()[0]).attr("target");
        if ($(this.element.children()[0]).attr("title") !== "") this.description = $(this.element.children()[0]).attr("title");

    },

    _click: function (event)
    {

        if (this.options.onClick)
            this.options.onClick(event, this);
        //this.fireEvent('onClick', [event, this]);

        var parentControl = this.control;

        while (parentControl.control)
        {
            parentControl = parentControl.control;
        }

        parentControl.afterMenuItemClick();

    },

    menuItemMouseOver: function (event)
    {

        if (this.subMenu !== null)
        {

            var item, menu, x, y;

            event = new Event(event);

            if (this.activeItem !== null) this.control.closeSubMenu();

            this.activeItem = this;

            $(this.element.children()[0]).addClass('active');

            x = $(this.element.children()[0]).offset().left + $(this.element.children()[0]).width();
            y = $(this.element.children()[0]).offset().top;

            var maxX, maxY;

            maxX = $(window).scrollLeft() + $(window).width();
            maxY = $(window).scrollTop() + $(window).height();

            maxX -= this.subMenu.element.width();
            maxY -= this.subMenu.element.height();

            if (x > maxX)
                x = Math.max(0, x - $(this.element.children()[0]).width()
                    - this.subMenu.element.width() + (this.control.element.width()
                        - $(this.element.children()[0]).width()));

            y = Math.max(0, Math.min(y, maxY));

            if (window.ie)
            {
                x -= 2;
            }

            this.subMenu.element.css({
                "left": x + "px",
                "top": y + "px",
                "visibility": "visible"
            });

            if (this.subMenu.dropShadowElement !== null)
            {
                this.subMenu.dropShadowElement.css({
                    "left": (x + 4) + "px",
                    "top": (y + 4) + "px",
                    "width": this.subMenu.element.width(),
                    "height": this.subMenu.element.height(),
                    "visibility": "visible"
                });
            }

            event.stop();

        }

    },

    addSubMenu: function (options)
    {

        var newMenu = new Menu($merge(options, { control: this, dropshadow: this.control.dropshadow, target: this.target }));

        if (newMenu !== null)
        {
            this.subMenu = newMenu;
            $(this.element.children()[0]).addClass("children");
        }

        return newMenu;

    }

};
$.extend(MenuItem.prototype, _MenuItemPrototype);


var MenuItemSeperator = function (options)
{
    this.initialize(options);
};
var _MenuItemSeperatorPrototype = {

    options: {
        control: null
    },

    initialize: function (options)
    {

        this.options = $.extend({}, this.options, options);
        this.control = this.options.control;

        if ($chk(this.options.element))
        {
            // Adopt the element as a menu

        } else
        {
            // Create the menu element
            this._build();
        }

    },

    _build: function ()
    {

        this.element = $("<li class='seperator'></li>");
        this.element.html('<span></span>'); //new Element("li", {"class":"seperator"}).setHTML('<span></span>');

        if ($chk(this.control.element)) this.control.element.children()[0].appendChild(this.element[0]);

    },

    _adopt: function (element)
    {
        element = ($type(element) === 'string') ? $("#" + element) : (element.jquery) ? element : $(element);
        if (element[0].tagName !== "li" || !element.hasClass("seperator")) return null;

        this.element = element;

    }

};
$.extend(MenuItemSeperator.prototype, _MenuItemSeperatorPrototype);

var ContextMenu = function (options)
{
    this.initialize(options);
};
var _ContextMenuPrototype = {

    options: {

    },

    clearTimer: function ()
    {
        if (this.timer !== null)
        {
            window.clearTimeout(this.timer);
            this.timer = null;
        }
    },

    initialize: function (options)
    {
        this.options = $.extend({}, this.options, options);
        Menu.prototype.initialize.apply(this, arguments);

        this.timer = null;
    },

    showContextMenu: function (event)
    {
        event.stopPropagation();
        this.showContextMenuAt({ event: event, x: event.clientX, y: event.clientY });
    },

    showContextMenuAt: function (coord)
    {
        this.clearTimer();

        if (checkExists(coord.event))
        {
            coord.event.preventDefault();
            coord.event.stopPropagation();
        }

        $("body").on("click.contextmenu", this.hideContextMenu.bind(this));
        $(this.element).on("mouseout.contextmenu", this.applyHideTimer.bind(this));
        $(this.element).on("mouseover.contextmenu", this.clearTimer.bind(this));
        this.element.find('.menu-item').on("focus.contextmenu", this.clearTimer.bind(this));

        var x, y, maxX, maxY;

        win = !!document.defaultView ? document.defaultView : document.parentWindow; // Determine the correct window element

        x = coord.x;
        y = coord.y;

        maxX = $(win).scrollLeft() + $(win).width();
        maxY = $(win).scrollTop() + $(win).height();

        maxX -= this.element.width();
        maxY -= this.element.height();

        if ((x + this.element.width()) > maxX)
        {
            x -= this.element.width();
        }

        if (x < 10)
        {
            x = 10;
        }

        y = Math.max(0, Math.min(y, maxY));
        y -= 10;

        this.originalMaxHeight = ($(win).height() - 10);

        this.element.css({
            "left": x + "px",
            "top": y + "px",
            "visibility": "visible",
            "max-height": this.originalMaxHeight + "px"
        });

        if (this.dropShadowElement !== null)
        {
            this.dropShadowElement.css({
                "left": (x + 3) + "px",
                "top": (y + 3) + "px",
                "width": this.element.width(),
                "height": this.element.heigth(),
                "visibility": "visible"
            });
        }

        this.applyHideTimer();

        this.element.find('.menu-item').first().trigger('focus');
    },

    hideContextMenu: function ()
    {
        this.clearTimer();
        this.closeMenu();

        $("body").off("click.contextmenu");
        $(this.element).off("mouseout.contextmenu");
        $(this.element).off("mouseover.contextmenu");
    },

    applyHideTimer: function (event)
    {
        this.clearTimer();
        this.timer = window.setTimeout(this.hideContextMenu.bind(this), 4000);
    }

};
$.extend(ContextMenu.prototype, _MenuPrototype, _ContextMenuPrototype);

var CheckBoxContextMenu = function (options)
{
    this.initialize(options);
};
var _CheckBoxContextMenuPrototype =
{

    options: {

    },

    initialize: function (options)
    {

        this.options = $.extend({}, this.options, options);
        Menu.prototype.initialize.apply(this, arguments);

        this.timers = [];

        this.hasChanged = false;

    },

    clearTimers: function ()
    {
        if (this.timers !== null)
        {
            for (var j = 0; j < this.timers.length; j++)
            {
                $clear(this.timers[j]);
            }
            this.timers = [];
        }
    },

    showContextMenu: function (event)
    {
        event.stopPropagation();
        this.showContextMenuAt({ event: event, x: event.clientX, y: event.clientY });
    },

    attachEvents: function ()
    {
        $("body").on("click.checkboxcontextmenu", function (event) { this.applyCheck(event); }.bind(this));
    },

    updateItem: function (thisId, thisChecked)
    {

        $this = this;

        for (var x = 0; x < $this.items.length; x++)
        {
            var item = $this.items[x];


            if (item.id === thisId)
            {

                var trueMe = $("label[id=FilterSearchScope_" + thisId + "]");

                if (!thisChecked)
                {
                    trueMe.removeClass("checked");
                    trueMe.addClass("unchecked");

                    item.checked = false;
                }
                else
                {
                    trueMe.removeClass("unchecked");
                    trueMe.addClass("checked");

                    item.checked = true;
                }
                break;
            }
        }

    },

    showContextMenuAt: function (coord)
    {
        this.clearTimers();

        this.timers[this.timers.length] = setTimeout(this.attachEvents.bind(this));
        $(this.element).on("mouseout.checkboxcontextmenu", this.applyHideTimer.bind(this));
        $(this.element).on("mouseover.checkboxcontextmenu", this.clearTimers.bind(this));

        var x, y, maxX, maxY;

        x = coord.x;
        y = coord.y;

        maxX = $(window).scrollLeft() + $(window).width();
        maxY = $(window).scrollTop() + $(window).height();

        maxX -= this.element.width();
        maxY -= this.element.height();

        if (x > maxX) x -= this.element.width();

        y = Math.max(0, Math.min(y, maxY));

        y -= 7;

        this.element.css({
            "left": x + "px",
            "top": y + "px",
            "visibility": "visible",
            "display": ""
        });

        if (this.dropShadowElement !== null)
        {
            this.dropShadowElement.css({
                "left": (x + 3) + "px",
                "top": (y + 3) + "px",
                "width": this.element.width(),
                "height": this.element.heigth(),
                "visibility": "visible"
            });
        }

        SourceCode.Forms.Widget.createUnderlay(this.element);
        this.applyHideTimer(coord.event);
    },

    hideContextMenu: function (event)
    {
        this.clearTimers();
        this.closeMenu();
        this.element.attr("visited", "true");

        if (this.hasChanged)
        {
            if (this.options.close)
            {
                this.options.close();
            }
            this.hasChanged = false;
        }
        $("body").off("click.checkboxcontextmenu");
        $(this.element).off("mouseout.checkboxcontextmenu");
        $(this.element).off("mouseover.checkboxcontextmenu");

        SourceCode.Forms.Widget.destroyUnderlay(this.element);
    },

    applyCheck: function (event)
    {
        if (event && event !== undefined && ($(event.target).hasClass('menu') || $(event.target).closest('.menu').length > 0)) return;

        if (this.dropShadowElement !== null) this.dropShadowElement.css("visibility", "hidden");

        this.hideContextMenu();

    },

    applyHideTimer: function (event)
    {
        var $this = this;
        this.timers[this.timers.length] = setTimeout(function () { $this.hideContextMenu(event); }, 1500);
    },

    afterMenuItemClick: function ()
    {
    }

};
$.extend(CheckBoxContextMenu.prototype, _MenuPrototype, _CheckBoxContextMenuPrototype);


//#regionRadioMenuItem  - a checkbox item in a popupmenu.
var RadioMenuItem = function (options)
{
    this.initialize(options);
};
var _RadioMenuItemPrototype = {

    options: {
        id: "",
        text: "",
        description: "",
        icon: "",
        location: "",
        target: "",
        hideURIs: false,
        onClick: null,
        checkbox: null,
        enabled: true
    },

    initialize: function (options)
    {
        this.options = $.extend({}, this.options, options);
        this.element = null;
        this.control = this.options.control;
        this.target = this.options.target;
        this.id = this.options.id;
        this.text = this.options.text;
        this.description = this.options.description;
        this.icon = this.options.icon;
        this.location = this.options.location;
        this.hideURIs = this.options.hideURIs;
        this.enabled = this.options.enabled;
        this.subMenu = null;

        if ($chk(this.options.element))
        {
            // Adopt the element as a menu
            this._adopt(this.options.element);
        } else
        {
            // Create the menu element
            this._build(this.options);
        }

        $(this.element.children()[0]).on('click.radiomenu-item', function (event) { this._click(event); }.bind(this));
        $(this.element.children()[0]).on('mouseover.radiomenu-item', function (event) { this.menuItemMouseOver(event); }.bind(this));
        //$(this.element.children()[0]).on("mouseout.checkmenu-item", this.applyHideTimer.bind(this));
    },

    _build: function (options)
    {
        this.element = $('<li></li>'); //THE MOO new Element("li");
        var name = "SearchCriteriaScope_" + this.id;

        var checked = checkExists(options) && options.checked === true ? true : false;

        if (!this.enabled) this.element.addClass("disabled");
        this.element.html('<a class="radiomenu-item" ' + (!this.enabled ? 'disabled="disabled"' : "") + ' href="javascript:;">' +
            '<label class="input-control radio' + (checked ? ' checked' : '') + '" id="' + name + '">' +
            '<INPUT class="input-control" value="' + this.id + '" type="radio" name="SearchCriteriaScope"' + (checked ? ' checked="checked"' : '') + ' />' +
            '<SPAN class="input-control-img"></SPAN><SPAN class="input-control-text">' +
            (typeof this.text === "string" ? this.text.htmlEncode() : this.text) + '</SPAN></label></a>');

        if ($chk(this.control.element)) $(this.control.element.children()[0]).append(this.element);

        if ($chk(this.id) && this.id !== "") this.element.children()[0].id = this.id;

        if ($chk(this.location) && this.location !== "") $(this.element.children()[0]).attr("href", this.location);

        //if ($chk(this.icon) && this.icon !== "") $(this.element.children()[0]).addClass(this.icon);

        if ($chk(this.target) && this.target !== "")
        {
            $(this.element.children()[0]).attr("target", this.target);
        } else if ($chk(this.control.target) && this.control.target !== "")
        {
            $(this.element.children()[0]).attr("target", this.control.target);
        }

        if ($chk(this.description) && this.description !== "") $(this.element.children()[0]).attr("title", this.options.description);
    },

    _adopt: function (element)
    {
        element = ($type(element) === 'string') ? $("#" + element) : (element.jquery) ? element : $(element);
        if (element[0].tagName !== "li") return null;
        this.element = element;
        if (this.element.children()[0].id !== "") this.id = this.element.children()[0].id;
        if ($(this.element.children()[0]).attr("href") !== "javascript:;") this.location = $(this.element.children()[0]).attr("href");
        if ($(this.element.children()[0]).attr("target") !== "") this.target = $(this.element.children()[0]).attr("target");
        if ($(this.element.children()[0]).attr("title") !== "") this.description = $(this.element.children()[0]).attr("title");

    },

    _click: function (event)
    {
        event.preventDefault();
        if ($(this.element).is(".disabled"))
            return;

        var parentControl = this.control;

        while (parentControl.control)
        {
            parentControl = parentControl.control;
        }

        var radioInputs = parentControl.element.find("input[name=SearchCriteriaScope]");

        //Uncheck all the radio inputs
        radioInputs.parent().removeClass("checked").removeClass("unchecked");
        radioInputs.radiobutton("uncheck");

        //Check the radio input that was clicked
        var checkedInput = this.element.find("input[type=radio]");
        checkedInput.parent().addClass("checked");
        checkedInput.radiobutton("check");

        if (this.options.onClick)
        {
            this.options.onClick(event, true);
        }
    },

    menuItemMouseOver: function (event)
    {
        if (this.subMenu !== null)
        {
            var item, menu, x, y;
            var maxX, maxY;

            event = new Event(event);

            if (this.activeItem !== null) this.control.closeSubMenu();

            this.activeItem = this;

            $(this.element.children()[0]).addClass('active');

            x = $(this.element.children()[0]).offset().left + $(this.element.children()[0]).width();
            y = $(this.element.children()[0]).offset().top;
            maxX = $(window).scrollLeft() + $(window).width();
            maxY = $(window).scrollTop() + $(window).height();
            maxX -= this.subMenu.element.width();
            maxY -= this.subMenu.element.height();

            if (x > maxX)
                x = Math.max(0, x - $(this.element.children()[0]).width()
                    - this.subMenu.element.width() + (this.control.element.width()
                        - $(this.element.children()[0]).width()));

            y = Math.max(0, Math.min(y, maxY));

            if (window.ie)
            {
                x -= 2;
            }

            this.subMenu.element.css({
                "left": x + "px",
                "top": y + "px",
                "visibility": "visible"
            });

            if (this.subMenu.dropShadowElement !== null)
            {
                this.subMenu.dropShadowElement.css({
                    "left": (x + 4) + "px",
                    "top": (y + 4) + "px",
                    "width": this.subMenu.element.width(),
                    "height": this.subMenu.element.height(),
                    "visibility": "visible"
                });
            }
            //event.stop();
        }
    },

    addSubMenu: function (options)
    {
        var newMenu = new Menu($merge(options, { control: this, dropshadow: this.control.dropshadow, target: this.target }));

        if (newMenu !== null)
        {
            this.subMenu = newMenu;
            $(this.element.children()[0]).addClass("children");
        }

        return newMenu;
    }
};
$.extend(RadioMenuItem.prototype, _RadioMenuItemPrototype);
//#endregion




//#region CheckMenuItem  - a checkbox item in a popupmenu.
var CheckMenuItem = function (options)
{
    this.initialize(options);
};
var _CheckMenuItemPrototype = {

    options: {
        id: "",
        text: "",
        description: "",
        icon: "",
        location: "",
        target: "",
        hideURIs: false,
        onClick: null,
        checkbox: null,
        enabled: true
    },

    initialize: function (options)
    {
        this.options = $.extend({}, this.options, options);
        this.element = null;
        this.control = this.options.control;
        this.target = this.options.target;
        this.id = this.options.id;
        this.text = this.options.text;
        this.description = this.options.description;
        this.icon = this.options.icon;
        this.location = this.options.location;
        this.hideURIs = this.options.hideURIs;
        this.checked = this.options.checked;
        this.enabled = this.options.enabled;
        this.subMenu = null;

        if ($chk(this.options.element))
        {
            // Adopt the element as a menu
            this._adopt(this.options.element);
        } else
        {
            // Create the menu element
            this._build();
        }

        $(this.element.children()[0]).on('click.checkmenu-item', function (event) { this._click(event); }.bind(this));
        $(this.element.children()[0]).on('mouseover.checkmenu-item', function (event) { this.menuItemMouseOver(event); }.bind(this));
        //$(this.element.children()[0]).on("mouseout.checkmenu-item", this.applyHideTimer.bind(this));
    },

    _build: function ()
    {
        this.element = $('<li></li>'); //THE MOO new Element("li");
        var name = "FilterSearchScope_" + this.id;

        if (this.enabled)
        {
            this.element.html('<a class="checkmenu-item" href="javascript:;">' +
                '<label class="input-control checkbox' + (this.checked ? ' checked' : '') + '" id="' + name + '">' +
                '<INPUT class="input-control" value="' + this.id + '" type="checkbox" name="FilterSearchScope"' + (this.checked ? ' checked="checked"' : '') + ' />' +
                '<SPAN class="input-control-img"></SPAN><SPAN class="input-control-text">' +
                (typeof this.text === "string" ? this.text.htmlEncode() : this.text) + '</SPAN></label></a>');
        }
        else
        {
            this.element.addClass("disabled");
            this.element.html('<a disabled="disabled" class="checkmenu-item" href="javascript:;">' +
                '<label class="input-control checkbox' + (this.checked ? ' checked' : '') + '" id="' + name + '">' +
                '<INPUT class="input-control" value="' + this.id + '" type="checkbox" name="FilterSearchScope"' + (this.checked ? ' checked="checked"' : '') + ' />' +
                '<SPAN class="input-control-img"></SPAN><SPAN class="input-control-text">' +
                (typeof this.text === "string" ? this.text.htmlEncode() : this.text) + '</SPAN></label></a>');
        }


        if ($chk(this.control.element)) $(this.control.element.children()[0]).append(this.element);

        if ($chk(this.id) && this.id !== "") this.element.children()[0].id = this.id;

        if ($chk(this.location) && this.location !== "") $(this.element.children()[0]).attr("href", this.location);

        //if ($chk(this.icon) && this.icon !== "") $(this.element.children()[0]).addClass(this.icon);

        if ($chk(this.target) && this.target !== "")
        {
            $(this.element.children()[0]).attr("target", this.target);
        } else if ($chk(this.control.target) && this.control.target !== "")
        {
            $(this.element.children()[0]).attr("target", this.control.target);
        }

        if ($chk(this.description) && this.description !== "") $(this.element.children()[0]).attr("title", this.options.description);
    },

    _adopt: function (element)
    {
        element = ($type(element) === 'string') ? $("#" + element) : (element.jquery) ? element : $(element);
        if (element[0].tagName !== "li") return null;
        this.element = element;
        if (this.element.children()[0].id !== "") this.id = this.element.children()[0].id;
        if ($(this.element.children()[0]).attr("href") !== "javascript:;") this.location = $(this.element.children()[0]).attr("href");
        if ($(this.element.children()[0]).attr("target") !== "") this.target = $(this.element.children()[0]).attr("target");
        if ($(this.element.children()[0]).attr("title") !== "") this.description = $(this.element.children()[0]).attr("title");

    },

    _click: function (event)
    {
        event.preventDefault();
        if ($(this.element).is(".disabled"))
            return;

        var parentControl = this.control;

        while (parentControl.control)
        {
            parentControl = parentControl.control;
        }

        var trueMeCB = this.element.find("input[type=checkbox]");
        if (trueMeCB.is(':checked'))
        {
            trueMeCB.parent().removeClass("checked").addClass("unchecked");
            trueMeCB.checkbox("uncheck");
            this.checked = false;
        }
        else
        {
            trueMeCB.parent().removeClass("unchecked").addClass("checked");
            trueMeCB.checkbox("check");
            this.checked = true;
        }

        if (this.options.onClick)
        {
            this.options.onClick(event, this.checked);
        }
    },

    menuItemMouseOver: function (event)
    {
        if (this.subMenu !== null)
        {
            var item, menu, x, y;
            var maxX, maxY;

            event = new Event(event);

            if (this.activeItem !== null) this.control.closeSubMenu();

            this.activeItem = this;

            $(this.element.children()[0]).addClass('active');

            x = $(this.element.children()[0]).offset().left + $(this.element.children()[0]).width();
            y = $(this.element.children()[0]).offset().top;
            maxX = $(window).scrollLeft() + $(window).width();
            maxY = $(window).scrollTop() + $(window).height();
            maxX -= this.subMenu.element.width();
            maxY -= this.subMenu.element.height();

            if (x > maxX)
                x = Math.max(0, x - $(this.element.children()[0]).width()
                    - this.subMenu.element.width() + (this.control.element.width()
                        - $(this.element.children()[0]).width()));

            y = Math.max(0, Math.min(y, maxY));

            if (window.ie)
            {
                x -= 2;
            }

            this.subMenu.element.css({
                "left": x + "px",
                "top": y + "px",
                "visibility": "visible"
            });

            if (this.subMenu.dropShadowElement !== null)
            {
                this.subMenu.dropShadowElement.css({
                    "left": (x + 4) + "px",
                    "top": (y + 4) + "px",
                    "width": this.subMenu.element.width(),
                    "height": this.subMenu.element.height(),
                    "visibility": "visible"
                });
            }
            //event.stop();
        }
    },

    addSubMenu: function (options)
    {
        var newMenu = new Menu($merge(options, { control: this, dropshadow: this.control.dropshadow, target: this.target }));

        if (newMenu !== null)
        {
            this.subMenu = newMenu;
            $(this.element.children()[0]).addClass("children");
        }

        return newMenu;
    }
};
$.extend(CheckMenuItem.prototype, _CheckMenuItemPrototype);
//#endregion


/* Filter menu options */
var FilterCheckBoxContextMenu = function (options)
{
    this.initialize(options);
};
var _FilterCheckBoxContextMenuPrototype =
{

    options: {

    },

    initialize: function (options)
    {
        this.options = $.extend({}, this.options, options);
        Menu.prototype.initialize.apply(this, arguments);
        this.timers = [];
        this.hasChanged = false;
    },

    clearTimers: function ()
    {
        if (this.timers !== null)
        {
            for (var j = 0; j < this.timers.length; j++)
            {
                $clear(this.timers[j]);
            }
            this.timers = [];
        }
    },

    showContextMenu: function (event)
    {
        event.stopPropagation();
        var element = $(event.currentTarget).find(".button-wrapper");
        var height = element.outerHeight() + 7;
        var width = ((element.outerWidth() + 7) / 2) >> 0;
        var offset = $(event.currentTarget).offset();
        this.showContextMenuAt({ event: event, x: offset.left + width, y: offset.top + height });
    },

    attachEvents: function ()
    {
        $("body").on("click.filtercheckboxcontextmenu", function (event) { this.applyCheck(event); }.bind(this));
    },

    updateItem: function (o, t)
    {
        $this = this;

        for (var x = 0; x < $this.items.length; x++)
        {
            var item = $this.items[x];

            if (item.id === o)
            {
                var trueMe = $("label[id=RulesFilterSearchScope_" + o + "]");

                if (!t)
                {
                    trueMe.removeClass("checked");
                    trueMe.addClass("unchecked");

                    item.checked = false;
                }
                else
                {
                    trueMe.removeClass("unchecked");
                    trueMe.addClass("checked");

                    item.checked = true;
                }
                break;
            }
        }
    },

    clearMenu: function ()
    {
        $this = this;

        for (var x = 0; x < $this.items.length; x++)
        {
            var item = $this.items[x];
            var trueMe = $("label[id=RulesFilterSearchScope_" + item.id + "]");
            var trueMeCheckbox = trueMe.find(':checkbox');
            trueMe.removeClass("unchecked");
            trueMe.addClass("checked");
            trueMeCheckbox.checkbox();
            trueMeCheckbox.checkbox("check");
            item.checked = true;
        }
    },

    removeMenuItems: function ()
    {
        $this = this;
        $this.items = [];
        $("#RulesFilterContext ul").children().remove();
    },

    showContextMenuAt: function (coord)
    {
        this.clearTimers();
        this.timers[this.timers.length] = setTimeout(this.attachEvents.bind(this));
        $(this.element).on("mouseout.checkboxcontextmenu", this.applyHideTimer.bind(this));
        $(this.element).on("mouseover.checkboxcontextmenu", this.clearTimers.bind(this));
        this.bindHideEvents();
        var x, y, maxX, maxY;
        x = coord.x;
        y = coord.y;
        maxX = $(window).scrollLeft() + $(window).width();
        maxY = $(window).scrollTop() + $(window).height();
        maxX -= this.element.width();
        maxY -= this.element.height();
        if (x > maxX) x -= this.element.width();
        y = Math.max(0, Math.min(y, maxY));
        y -= 7;

        this.element.css({
            "left": x + "px",
            "top": y + "px",
            "visibility": "visible",
            "display": ""
        });

        if (this.dropShadowElement !== null)
        {
            this.dropShadowElement.css({
                "left": (x + 3) + "px",
                "top": (y + 3) + "px",
                "width": this.element.width(),
                "height": this.element.heigth(),
                "visibility": "visible"
            });
        }

        SourceCode.Forms.Widget.createUnderlay(this.element);
        this.applyHideTimer(coord.event);
    },

    hideContextMenu: function (event)
    {
        this.clearTimers();
        this.closeMenu();
        this.element.attr("visited", "true");

        if (this.hasChanged)
        {
            if (this.options.close)
            {
                this.options.close();
            }
            this.hasChanged = false;
        }
        $("body").off("click.checkboxcontextmenu");
        $(this.element).off("mouseout.checkboxcontextmenu");
        $(this.element).off("mouseover.checkboxcontextmenu");
        if ($('#fdrwRulesFilterBtn').hasClass("menu-active"))
        {
            $('#fdrwRulesFilterBtn').removeClass("menu-active");
        }
        if ($('#vdrwRulesFilterBtn').hasClass("menu-active"))
        {
            $('#vdrwRulesFilterBtn').removeClass("menu-active");
        }

        SourceCode.Forms.Widget.destroyUnderlay(this.element);
    },

    bindHideEvents: function ()
    {
        var hideMenu = this.hideContextMenu.bind(this);
        $("#viewActionsListTable").off("click.contextMenuHide").on("click.contextMenuHide", hideMenu);
        $("#pgWizard_pgRulesStep").off("click.contextMenuHide").on("click.contextMenuHide", hideMenu);
        $("#pgRuleList .grid-body *").off("click.contextMenuHide").on("click.contextMenuHide", hideMenu);
        $("#pgRuleList .grid-header *").off("click.contextMenuHide").on("click.contextMenuHide", hideMenu);
        $("#pgRuleList .grid-toolbars").off("click.contextMenuHide").on("click.contextMenuHide", hideMenu);
        $("#pgRuleList").find(".grid-content-cell-wrapper").off("click.contextMenuHide").on("click.contextMenuHide", hideMenu);
        $("#rgAddRule").off("click.contextMenuHide").on("click.contextMenuHide", hideMenu);
        $("body").find(".steptree").off("click.steptree", "li", hideMenu).on("click.steptree", "li", hideMenu);
    },

    applyCheck: function (event)
    {
        if (event && event !== undefined && ($(event.target).hasClass('menu') || $(event.target).closest('.menu').length > 0)) return;

        if (this.dropShadowElement !== null) this.dropShadowElement.css("visibility", "hidden");

        this.bindHideEvents();
    },

    applyHideTimer: function (event)
    {
        var $this = this;
        this.timers[this.timers.length] = setTimeout(function () { $this.hideContextMenu(event); }, 1500);
    },

    afterMenuItemClick: function ()
    {
    }

};
$.extend(FilterCheckBoxContextMenu.prototype, _MenuPrototype, _FilterCheckBoxContextMenuPrototype);

var FilterCheckMenuItem = function (options)
{
    this.initialize(options);
};
var _FilterCheckMenuItemPrototype = {

    options: {
        id: "",
        text: "",
        description: "",
        icon: "",
        location: "",
        target: "",
        hideURIs: false,
        onClick: null,
        checkbox: null,
        enabled: true
    },

    initialize: function (options)
    {

        this.options = $.extend({}, this.options, options);
        this.element = null;
        this.control = this.options.control;
        this.target = this.options.target;
        this.id = this.options.id;
        this.text = this.options.text;
        this.description = this.options.description;
        this.icon = this.options.icon;
        this.location = this.options.location;
        this.hideURIs = this.options.hideURIs;
        this.checked = this.options.checked;
        this.enabled = this.options.enabled;
        this.subMenu = null;

        if ($chk(this.options.element))
        {
            // Adopt the element as a menu
            this._adopt(this.options.element);
        } else
        {
            // Create the menu element
            this._build();
        }

        $(this.element.children()[0]).on('click.checkmenu-item', function (event) { this._click(event); }.bind(this));
        $(this.element.children()[0]).on('mouseover.checkmenu-item', function (event) { this.menuItemMouseOver(event); }.bind(this));
        //$(this.element.children()[0]).on("mouseout.checkmenu-item", this.applyHideTimer.bind(this));
    },

    _build: function ()
    {
        this.element = $('<li></li>'); //THE MOO new Element("li");
        var name = "RulesFilterSearchScope_" + this.id;

        if (this.enabled)
        {
            this.element.html('<a class="checkmenu-item" href="javascript:;">' +
                '<label class="input-control checkbox' + (this.checked ? ' checked' : '') + '" id="' + name + '">' +
                '<INPUT class="input-control" value="' + this.id + '" type="checkbox" name="RulesFilterSearchScope"' + (this.checked ? ' checked="checked"' : '') + ' />' +
                '<SPAN class="input-control-img"></SPAN><SPAN class="input-control-text" style="margin-left: 10px;">' +
                (typeof this.text === "string" ? this.text.htmlEncode() : this.text) + '</SPAN></label></a>');
        }
        else
        {
            this.element.addClass("disabled");
            this.element.html('<a disabled="disabled" class="checkmenu-item" href="javascript:;">' +
                '<label class="input-control checkbox' + (this.checked ? ' checked' : '') + '" id="' + name + '">' +
                '<INPUT class="input-control" value="' + this.id + '" type="checkbox" name="RulesFilterSearchScope"' + (this.checked ? ' checked="checked"' : '') + ' />' +
                '<SPAN class="input-control-img"></SPAN><SPAN class="input-control-text" style="margin-left: 10px;">' +
                (typeof this.text === "string" ? this.text.htmlEncode() : this.text) + '</SPAN></label></a>');
        }

        if ($chk(this.control.element)) $(this.control.element.children()[0]).append(this.element);

        if ($chk(this.id) && this.id !== "") this.element.children()[0].id = this.id;

        if ($chk(this.location) && this.location !== "") $(this.element.children()[0]).attr("href", this.location);

        if ($chk(this.target) && this.target !== "")
        {
            $(this.element.children()[0]).attr("target", this.target);
        } else if ($chk(this.control.target) && this.control.target !== "")
        {
            $(this.element.children()[0]).attr("target", this.control.target);
        }

        if ($chk(this.description) && this.description !== "") $(this.element.children()[0]).attr("title", this.options.description);

    },

    _adopt: function (element)
    {
        element = ($type(element) === 'string') ? $("#" + element) : (element.jquery) ? element : $(element);
        if (element[0].tagName !== "li") return null;

        this.element = element;

        if (this.element.children()[0].id !== "") this.id = this.element.children()[0].id;

        if ($(this.element.children()[0]).attr("href") !== "javascript:;") this.location = $(this.element.children()[0]).attr("href");
        if ($(this.element.children()[0]).attr("target") !== "") this.target = $(this.element.children()[0]).attr("target");
        if ($(this.element.children()[0]).attr("title") !== "") this.description = $(this.element.children()[0]).attr("title");

    },

    _click: function (event)
    {
        var $this = this;
        event.preventDefault();
        if ($(this.element).is(".disabled"))
            return;

        if (this.options.onClick)
            this.options.onClick();

        var parentControl = this.control;

        while (parentControl.control)
        {
            parentControl = parentControl.control;
        }

        var trueMe = $("label[id=RulesFilterSearchScope_" + $this.id + "]");
        var trueMeCB = trueMe.find(':checkbox');
        if (trueMeCB.is(':checked'))
        {
            trueMe.removeClass("checked");
            trueMe.addClass("unchecked");
            trueMeCB.checkbox("uncheck");
            $this.checked = false;
        }
        else
        {
            trueMe.removeClass("unchecked");
            trueMe.addClass("checked");
            trueMeCB.checkbox("check");
            $this.checked = true;
        }
    },

    menuItemMouseOver: function (event)
    {
        if (this.subMenu !== null)
        {
            var item, menu, x, y;
            var maxX, maxY;
            event = new Event(event);
            if (this.activeItem !== null) this.control.closeSubMenu();
            this.activeItem = this;
            $(this.element.children()[0]).addClass('active');
            x = $(this.element.children()[0]).offset().left + $(this.element.children()[0]).width();
            y = $(this.element.children()[0]).offset().top;
            maxX = $(window).scrollLeft() + $(window).width();
            maxY = $(window).scrollTop() + $(window).height();
            maxX -= this.subMenu.element.width();
            maxY -= this.subMenu.element.height();

            if (x > maxX)
                x = Math.max(0, x - $(this.element.children()[0]).width()
                    - this.subMenu.element.width() + (this.control.element.width()
                        - $(this.element.children()[0]).width()));

            y = Math.max(0, Math.min(y, maxY));

            if (window.ie)
            {
                x -= 2;
            }

            this.subMenu.element.css({
                "left": x + "px",
                "top": y + "px",
                "visibility": "visible"
            });

            if (this.subMenu.dropShadowElement !== null)
            {
                this.subMenu.dropShadowElement.css({
                    "left": (x + 4) + "px",
                    "top": (y + 4) + "px",
                    "width": this.subMenu.element.width(),
                    "height": this.subMenu.element.height(),
                    "visibility": "visible"
                });
            }
        }
    },

    addSubMenu: function (options)
    {
        var newMenu = new Menu($merge(options, { control: this, dropshadow: this.control.dropshadow, target: this.target }));

        if (newMenu !== null)
        {
            this.subMenu = newMenu;
            $(this.element.children()[0]).addClass("children");
        }
        return newMenu;
    }

};
$.extend(FilterCheckMenuItem.prototype, _FilterCheckMenuItemPrototype);
