(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

    SourceCode.Forms.Controls.RadioMenu = {
        _create: function ()
        {
            this.value = "";
            this.contextmenu = null;
            this.itemsDictionary = {};
            this.paneWidth = 0; //please see init, for the real initialized value.


            this._createContextMenu();
            this._initClickHandler();
        },

        _init: function ()
        {
            //LG: If the paneWidth prop isn't set, then the hyperlink will always be "...", 
            //    as it thinks there is no space to list the checked items (see html() method)
            //	  So, if the <A> tag is already block/inline-block, we may as well initialize 
            //    with its width instead of 0, so at least in those cases, there will be no need to call SetPaneWidth expternally. 
            this.paneWidth = this.element.width(); //this.element is not available in _create().
        },


        _destroy: function ()
        {

        },

        _createContextMenu: function ()
        {
            $this = this;
            if ($this.contextmenu == null)
            {
                $this.contextmenu = new CheckBoxContextMenu({
                    id: "SearchCriteriaMenu",
                    dropshadow: false,
                    close: $this._closing.bind($this)
                });
            }
        },

        _closing: function ()
        { //triggers when the check menu is closing
            this._trigger("closing");
        },


        _initClickHandler: function ()
        {
            var $checkmenu = this;

            $checkmenu.element.on("click", function (ev)
            {
                $checkmenu._trigger("click", ev);
            })
        },

        showContextMenu: function (ev)
        {
            this.contextmenu.showContextMenu(ev);
        },

        addSeperator: function ()
        {
            this.contextmenu.addSeperator();
        },

        addItem: function (itemmeta)
        {
            var item = this.contextmenu.addItem(itemmeta);

            //FIX: ensure that the checkbox widget has been initialized on the new item.
            var cb = item.element.find("input[type=radio]");
            if (!cb.data("ui-radiobox")) cb.radiobutton();

            var _this = this;
            item.element.on("click", function (ev)
            {
                _this._checkcontextmenuclick(itemmeta.id, item.element);
            });

            this.itemsDictionary[itemmeta.id] = itemmeta;
            if (itemmeta.checked === true) this.value = itemmeta.id;
        },

        //return the currently selected item
        val: function ()
        {
            return this.value;
        },

        countItems: function ()
        {
            return this.contextmenu.items.length;
        },

        setPaneWidth: function ()
        {
            var newvalue = arguments[0];
            this.paneWidth = (!!newvalue && newvalue != 0 && newvalue != "0") ? newvalue : this.element.width();
        },

        disableItem: function (itemName)
        {
            var cb = this.contextmenu.element.find(".input-control[value=" + itemName + "]");
            cb.radiobox("disable");
            cb.closest("a.radiomenu-item").prop("disabled", true);
            cb.closest("li").addClass("disabled");
        },

        enableItem: function (itemName)
        {
            var cb = this.contextmenu.element.find(".input-control[value=" + itemName + "]");
            cb.radiobox("enable");
            cb.closest("a.radiomenu-item").prop("disabled", false);
            cb.closest("li").removeClass("disabled");
        },

        html: function (text)
        {
            this.element.html(text);
            this.element[0].title = text;
        },

        _checkcontextmenuclick: function (id, el)
        {
            this.value = id;
            if (checkExists(id) && checkExists(el))
            {
                this._trigger("onChange");
            }

            //TODO: update the labels, but only if its not an icon button!
            if (this.options.buttonMode !== true)
            {
                this.html($(el).text());
            }
        },

        //To reset the menu to user chosen configuration
        //If user hasn't made any selections, use default inclusions
        refresh: function ()
        {
            this._checkcontextmenuclick();
        },

        //helper method for arrays.
        _removeItemFromArray: function (arr, itemToRemove)
        {
            var itemIndex = arr.indexOf(itemToRemove);
            if (itemIndex > -1)
            {
                arr.splice(itemIndex, 1);
            }
        }
    }

    if (typeof SCRadioMenu === "undefined") SCRadioMenu = SourceCode.Forms.Controls.RadioMenu;

    $.widget("ui.radiomenu", SourceCode.Forms.Controls.RadioMenu);

    $.extend($.ui.radiomenu, {
        getter: "addItem showContextMenu countItems addSeperator tag html val checkItem setPaneWidth",
        options: {
            onChange: null, //a trigger for when the item changes.
            buttonMode: "false" //this decides whether the control is spawned from a hyperlink (text) or a button (arrow)
        }
    });

})(jQuery);
