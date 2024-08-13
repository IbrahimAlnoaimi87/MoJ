(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Widget === "undefined" || SourceCode.Forms.Widget === null) SourceCode.Forms.Widget = {};

    SourceCode.Forms.Widget.FileTab =
    {
        _datatype: null,
        _name: null,
        _emptyText: null,
        _toolTip: null,
        _readOnly: null,
        _allowEmpty: null,
        _hasError: false,  //whether the control is should have a visual error or not.

        _create: function ()
        {
            this.txtName = this.element.find("input[type=text]");
            this.lblName = this.element.find("label");
            this.iconElement = this.element.find(".icon");
            this.btnClose = this.element.find(".close-container");
            this.lblButton = this.element.find(".name-container a");

            this._emptyText = this.options.emptyText;
            this._toolTip = this.options.toolTip;
            this._readOnly = this.options.readOnly;

            if (this.options.showClose === false)
            {
                this.btnClose.hide(); //display none - so the flex box will take up remaining space.
            }

            if (!!this.options.datatype)
            {
                this.type(this.options.datatype);
            }

            if (this.options.readOnly === true)
            {
                this.readOnly(this._readOnly);
            }

            if (this.options.error === true)
            {
                this.errorState(true);
            }

            this._allowEmpty = (this.options.allowEmpty === true);

            //create a single delegate - prevents multiple registrations.
            this._lblButton_Click_delegate = this._lblButton_Click.bind(this);

            //attach events
            this._attachEvents();
        },

        //Attach initial events needed for control to function
        _attachEvents: function ()
        {
            if (this._eventsAttached === true) return;
            if (!this._readOnly)
            {
                this.lblButton.on("click", this._lblButton_Click_delegate);
            }
            this.btnClose.on("click", this._btnClose_Click.bind(this));
            this._eventsAttached = true;
        },

        _detachEvents: function ()
        {
            this.lblButton.off("click", this._lblButton_Click_delegate);
            this._eventsAttached = false;
        },

        //allow dymanic off/on of readOnly mode after creation
        readOnly: function (value)
        {
            if (!checkExists(value))
            {
                return this._readOnly;
            }

            if (value !== true && value !== false) return;

            this._readOnly = value;
            this.options.readOnly = value;

            if (value === true)
            {
                this.element.addClass("readonly");
                this._detachEvents();
            }
            else
            {
                this.element.removeClass("readonly");
                this._attachEvents();
            }
        },

        //put focus in the filetab
        focus: function ()
        {
            if (!this._readOnly)
            {
                this._enterEditMode();
            }
        },

        //overload for setting the value of the control (val is the canonical name for this method in jq)
        val: function ()
        {
            return this.name(value);
        },

        //public method
        //update the name inside the tab. Will not trigger name change.
        name: function (value)
        {
            if (typeof (value) != "string") return this._name;

            if (checkExistsNotEmpty(value))
            {
                this.element.removeClass("empty");
                this.lblName.text(value);
                this.txtName.val(value);
                this._name = value;
            }
            else
            {
                //put it in empty mode
                this.element.addClass("empty");
                this.lblName.text(this._getWatermarkText());
                this.txtName.val("");
                this._name = "";
            }
            return this._name;
        },

        tooltip: function (value)
        {
            if (!!value)
            {
                //set the value
                this._toolTip = value;
                this.element.attr("title", this._toolTip);
            }
            else
            {
                //return the value
                return this._toolTip;
            }
        },


        errorState: function (value, message, actions)
        {
            if (typeof value !== "boolean") return this._hasError;

            this._hasError = value;
            if (this._hasError === true)
            {
                this._showError(message);
            }
            else
            {
                this._hideError();
            }

        },

        //message - ready for the full badging control in the future.
        //actions - ready for the full badging control in the future.
        _showError: function (message, actions)
        {
            if (checkExists(this.iconElement))
            {
                this.iconElement.addClass("error");
            }
        },

        //ready for the full badging control in the future.
        _hideError: function ()
        {
            if (checkExists(this.iconElement))
            {
                this.iconElement.removeClass("error");
            }
        },

        _getWatermarkText: function ()
        {
            var result = "";

            //if custom empty text has been set, use it. Otherwise use the automatic empty-text.
            if (checkExists(this._emptyText))
            {
                result = this._emptyText;
            }
            else
            {
                if (!!this._datatype)
                {
                    switch (this._datatype.toLowerCase())
                    {
                        case "smartobject": result = Resources.ObjectNames.SmartObjectEmptyFileName; break;
                        case "workflow": result = Resources.ObjectNames.WorkflowProcessEmptyFileName; break;
                        case "view": result = Resources.ObjectNames.SmartViewEmptyFileName; break;
                        case "form": result = Resources.ObjectNames.SmartFormEmptyFileName; break;
                        case "styleprofile": result = Resources.ObjectNames.StyleProfileEmptyFileName; break;
                        default: result = "";
                    }
                }
            }
            return result;
        },

        //public method
        //update the name inside the tab. Will not trigger name change.
        type: function (value)
        {
            if (checkExists(value) && typeof (value) === "string")
            {
	            this._datatype = value;

	            var cssclass = "unknown";
	            switch (value.toLowerCase())
	            {
	                case "smartobject": cssclass = "ic-smartobject"; break;
	                case "workflow": cssclass = "ic-workflow"; break;
	                case "view": cssclass = "ic-view"; break;
                    case "form": cssclass = "ic-form"; break;
                    case "styleprofile": cssclass = "ic-styleprofile"; break;
	                case "rule": cssclass = "ic-rule"; break;
	            }
	            cssclass += " iconset-filetypes";
                this.iconElement.removeClass("ic-smartobject ic-view ic-form ic-styleprofile ic-workflow ic-rule");
	            this.iconElement.addClass(cssclass);
	        }
            else
            {
                this._datatype = null;
                this.iconElement.removeClass("ic-smartobject ic-view ic-form ic-styleprofile ic-workflow ic-rule");
            }
        },

        //if the filetab is in empty mode.
        _isEmptyMode: function ()
        {
            return !this._name || this._name === "";
        },

        _lblButton_Click: function (e)
        {
            this._enterEditMode(e);
            e.preventDefault();
            return false;
        },

        _enterEditMode: function (e)
        {
            if (this._readOnly !== true)
            {
                this._bindTextBoxEvents();
                this.element.addClass("editing");
                this.txtName.val(this._isEmptyMode() ? "" : this.lblName.text());
                this.txtName.trigger("focus");
                this.txtName.trigger("select");

                this._updateTextboxSize();
            }
        },

        _bindTextBoxEvents: function ()
        {
            this.txtName.on("keypress", this._txtName_Keypress.bind(this));
            this.txtName.on("keyup", this._txtName_Keyup.bind(this));
            this.txtName.on("keydown", this._txtName_Keydown.bind(this));
            this.txtName.on("blur", this._txtName_Blur.bind(this));
        },

        _unbindTextBoxEvents: function ()
        {
            this.txtName.off("keypress", this._txtName_Keypress.bind(this));
            this.txtName.off("keyup", this._txtName_Keyup.bind(this));
            this.txtName.off("keydown", this._txtName_Keydown.bind(this));
            this.txtName.off("blur", this._txtName_Blur.bind(this));
        },

        _updateTextboxSize: function (isDownCharacter, ev)
        {
            var value = this.txtName.val();

            //if the user is doing a keydown, the value of the keypressed isn't in val() yet, even though the browser has updated the UI.
            if (isDownCharacter)
            {
                //see http://stackoverflow.com/a/5829387 - only visual characters (no function keys)
                if ((48 <= ev.which && ev.which <= 90) ||
                    (96 <= ev.which && ev.which <= 111) ||
                    (160 <= ev.which && ev.which <= 176) ||
                    (219 <= ev.which && ev.which <= 222) ||
                    (ev.which === 32)
                )
                {
                    var char = String.fromCharCode(ev.which);
                    value += (ev.shiftKey) ? char : char.toLowerCase();  //ev.which on a keydown is actually a keycode, not a charcode.
                }
            }

            var fontSize = parseFloat(this.txtName.css("fontSize"));
            var newWidth = this._getTextWidth(this.txtName.css("font"), value);

            this.lblName.css("width", newWidth);
            this.txtName.css("width", newWidth);
            this.txtName.attr("size", "1");
        },

        _getTextWidth: function (font, value)
        {

            if (!this._fontsizeDiv)
            {
                this._containerFontSizeDiv = $("<div></div>").css({ 'position': 'absolute', 'width': 0, 'height': 0, 'visibility': 'hidden' });
                this._fontsizeDiv = $('<div></div>')
                    .css({ 'position': 'absolute', 'float': 'left', 'white-space': 'pre', 'visibility': 'hidden', 'font': font })
                    .appendTo(this._containerFontSizeDiv).appendTo(this.element);
            }

            this._fontsizeDiv.text(value);
            return this._fontsizeDiv.width();
        },

        _txtName_Keyup: function (e)
        {
            this._updateTextboxSize();
            switch (e.which)
            {
                case 13: //ENTER
                    this.lblButton.trigger("focus"); //this will cause txtName blur to occur.
                    return false;
                case 27: //ESC
                    this.txtName.val(this.lblName.text());
                    this.lblButton.trigger("focus"); //this will cause txtName blur to occur.
                    return false;
            }
        },

        _txtName_Keypress: function (e)
        {
            this._updateTextboxSize(true, e);
            //TODO: check for ENTER and other keys and do not fire Altered for those.    
            this._trigger("nameAltered", this.txtName.val());
        },

        _txtName_Keydown: function (e)
        {
            //on keydown we only care about backspace/del, for when there is auto-repeats (as press/up wont fire)
            if (e.which === 8 || e.which === 46)
            {
                this._updateTextboxSize(true, e);
            }
        },

        _txtName_Blur: function (e)
        {
            var newValue = this.txtName.val();

            var newValueIsEmpty = (!newValue || newValue === "");

            if (this._allowEmpty === true || newValueIsEmpty === false)
            {
                this._name = newValue;
                this.lblName.text(newValue);
                this._trigger("nameChanged", e, [newValue, this._datatype]);
            }

            //Check for empty
            if (newValueIsEmpty === false)
            {
                this.element.removeClass("empty");
            }

            this._unbindTextBoxEvents();
            this.element.removeClass("editing");

            //reset to auto - this should animate with the css.
            //must be after the editing class is removed.
            this.lblName.css("width", "");
        },


        //when the close button is clicked.
        _btnClose_Click: function (e)
        {
            this._trigger("close");
            this.element.removeClass("editing");
            e.preventDefault();
            return false;
        }
    };

    $.widget("ui.filetab", SourceCode.Forms.Widget.FileTab);
    $.extend($.ui.filetab.prototype,
        {
            options:
            {
                nameAltered: null, //for keystroke level updates 
                nameChanged: null, //for when the name is committed to the control.
                close: null,
                emptyText: null, //needs to be localized on the serverside already.
                tooltip: "", //may need to be changed depending on usage of this control (e.g. rules file name)
                readOnly: false, //defines whether the file name can be changed - there may be some ui to show when it's locked.
                showClose: true, //whether the close 'X' button should show
                datatype: null, //initial setting of the filetype of the tab
                allowEmpty: false //allow empty text - if false, this will revert to the previous text on blur, if the user leaves it empty.
            }

        });
})(jQuery);
