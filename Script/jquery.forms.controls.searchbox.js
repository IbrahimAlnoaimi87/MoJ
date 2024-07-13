(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Widget === "undefined" || SourceCode.Forms.Widget === null) SourceCode.Forms.Widget = {};


    //The client-side logic for SourceCode.Forms.Web.Controls.SearchBox (SearchBox.cs)
    SourceCode.Forms.Widget.SearchBox =
    {
        _matchMode: "contains",
        _value: "",

        _create: function ()
        {
            this.radiomenu = null;
            this.txtCriteria = this.element.find("input[type=text]");
            this.btnSearch = this.element.find("a.search");
            this.btnClear = this.element.find("a.clear-search");
            this.btnCriteria = this.element.find("a.criteria-button");


            //initialize as a textbox ctl - this may have already been done.
            this.ctlCriteria = this.element.find(".input-control.text-control");
            if (!this.ctlCriteria.data("ui-textbox")) this.ctlCriteria.textbox();


            //attach events
            this.txtCriteria.on("keydown", this._txtCriteria_Keydown.bind(this));
            this.txtCriteria.on("keyup", this._txtCriteria_Keyup.bind(this));
            this.txtCriteria.on("blur", this._txtCriteria_Blur.bind(this));
            this.btnClear.on("click", this._btnClear_Click.bind(this));

            //set up styles.
            this.btnSearch.removeClass("inactive");
            this.btnClear.addClass("inactive");

            this._initOptionMenu();
        },

        _btnSearch_Click: function (e)
        {
            this._search();
            e.preventDefault();
            return false;
        },

        _btnClear_Click: function (e)
        {
            this.btnSearch.removeClass("inactive");
            this.btnClear.addClass("inactive");
            this.txtCriteria.trigger("focus");
            this.txtCriteria.val("");
            this._trigger("onCancel");
            e.preventDefault();
            return false;
        },

        //build a optionmenu with Starts with, Contains, etc.
        //attaches to the criteria arrow button
        _initOptionMenu: function ()
        {
            if (!checkExists(this.radiomenu))
            {
                var $this = this;
                var jqElement = this.btnCriteria;
                if (jqElement.length == 1 && !this.radiomenuElement)
                {
                    this.radiomenuElement = jqElement.radiomenu({
                        buttonMode: true, //this makes sure the selected item text isn't copied into the dropdown control.
                        click: $this._clickRadioMenu.bind($this),
                        onChange: $this._criteriaOptionChanged.bind($this)
                    });
                    this.radiomenu = this.radiomenuElement.data("ui-radiomenu"); //get a reference to the instance.
                    this._loadRadioContextMenu();
                }
            }
        },

        //when the criteriaOptions arrow is clicked.
        //LG: surely this should be part of the radiomenu widget?
        _clickRadioMenu: function (ev)
        {
            this.radiomenu.showContextMenu(ev);
        },


        //when the criteria menu optin changes (from contains, to startswith etc)
        _criteriaOptionChanged: function (ev)
        {
            //get the chosen item
            this._matchMode = this.radiomenu.val();
            this._trigger("onMatchChanged");
        },

        _loadRadioContextMenu: function ()
        {
            var $this = this;
            if ($this.radiomenu.countItems() === 0)
            {

                //----------------------------------------------------------------------------
                this.radiomenu.addItem({
                    text: Resources.CommonActions.ContainsText,
                    id: "contains",
                    description: Resources.CommonActions.ContainsText,
                    checked: true,
                    type: "radiobutton"
                });

                //----------------------------------------------------------------------------
                this.radiomenu.addItem({
                    text: Resources.CommonActions.BeginsWithText,
                    id: "begins-with",
                    description: Resources.CommonActions.BeginsWithText,
                    checked: false,
                    type: "radiobutton"
                });

                //----------------------------------------------------------------------------
                this.radiomenu.addItem({
                    text: Resources.CommonActions.EndsWithText,
                    id: "ends-with",
                    description: Resources.CommonActions.EndsWithText,
                    checked: false,
                    type: "radiobutton"
                });

                //----------------------------------------------------------------------------
                this.radiomenu.addItem({
                    text: Resources.CommonActions.EqualsText,
                    id: "equals",
                    description: Resources.CommonActions.EqualsText,
                    checked: false,
                    type: "radiobutton"
                });

                //----------------------------------------------------------------------------
                this.radiomenu.addItem({
                    text: Resources.CommonActions.NotEqualsText,
                    id: "not-equals",
                    description: Resources.CommonActions.NotEqualsText,
                    checked: false,
                    type: "radiobutton"
                });
            }
        },



        //a timer for when the autosearch should happen.
        _t: null,

        _txtCriteria_Keyup: function (e)
        {

            //clear the auto-search timer.
            if (typeof (this._t) != "undefined") clearTimeout(this._t);

            if (e.keyCode === 13)
            {
                this._search();
            }

            if (this.txtCriteria.val() === "")
            {
                this._showCancelled(e);
            }
            else
            {
                //set the timer.
                this._t = setTimeout(this._typing_timer_complete.bind(this), this.options.searchDelay);

                //update the buttons
                this.btnSearch.addClass("inactive");
                this.btnClear.removeClass("inactive");
            }
        },

        _showCancelled: function (e) 
        {
            this._showEmpty();
            this._trigger("onCancel", e);
        },

        _showEmpty: function (e)
        {
            //update the buttons.
            this.btnClear.addClass("inactive");
            this.btnSearch.removeClass("inactive");
        },

        //will search after inactivity.
        _typing_timer_complete: function (e)
        {
            this._search();
        },

        _txtCriteria_Keydown: function (e)
        {

        },

        _txtCriteria_Blur: function (e)
        {
            if (typeof (this._t) != "undefined") clearTimeout(this._t);
        },

        _search: function ()
        {
            if (typeof (this._t) != "undefined") clearTimeout(this._t);
            this._trigger("onSearch");
        },

        //public method - get/set the value of the search textbox
        val: function (value)
        {
            if (checkExists(value && typeof (value == "string")))
            {
                //update the textbox
                this.txtCriteria.val(value);

                //If setting to an empty string, then make sure the search box buttons update.
                if (value == "")
                {
                    //its an empty box, so return to normal mode.
                    this._showEmpty();
                }
            }
            else
            {
                return this.txtCriteria.val();
            }
        },

        //public method
        focus: function ()
        {
            this.txtCriteria.trigger("focus");
        },

        //get/set the value of the search criteria (startswith, contains etc)
        filter: function ()
        {
            if (checkExists(arguments[0]))
            {
                //TODO: Probably needs to be settable also in this method.
            }
            else
            {
                return this._matchMode;
            }
        },

        //public method
        enable: function ()
        {
            this.element.removeClass("disabled");
            //this.ctlCriteria.enable();
            //this.btnSearch.enable();
            //this.btnClear.enable();
            //this.btnCriteria.enable();
            if (!this.element.hasClass('read-only'))
            {
                $.Widget.prototype.enable.apply(this, arguments);
            }
        },

        //public method
        disable: function ()
        {
            this.element.addClass("disabled");
            //this.ctlCriteria.disable();
            //this.btnSearch.disable();
            //this.btnClear.disable();
            //this.btnCriteria.disable();
            $.Widget.prototype.disable.apply(this, arguments);
        },

        //public method
        readonly: function ()
        {
            this.element.addClass("read-only");
            $.Widget.prototype.disable.apply(this, arguments);
        },

        //public method - opposite of readonly
        editable: function ()
        {
            this.element.removeClass("read-only");
            if (!this.element.hasClass('disabled'))
            {
                $.Widget.prototype.enable.apply(this, arguments);
            }
        },

    };

    $.widget("ui.searchbox", SourceCode.Forms.Widget.SearchBox);
    $.extend($.ui.searchbox.prototype,
        {
            options:
            {
                onSearch: null, //when the user hits enter or pauses typing.
                onCancel: null, //when the X is clicked.  
                onMatchChanged: null, //when the starts with/equals options are changed.         
                searchDelay: 400 //milliseconds delay after the last character was typed before searching starts
            }

        });


})(jQuery);
