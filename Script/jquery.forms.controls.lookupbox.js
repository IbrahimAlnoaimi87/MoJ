(function ($)
{
    var _runtimeIOSMobileRegex = /(iPhone|iPad)/i;
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

    SourceCode.Forms.Controls.LookupBox = {

        options:
        {
            selector: "input[type=text]", //the selector to bind the focus and blur methods to for watermarktext behaviour
            focusViaClick: false
        },

        _create: function ()
        {
            this.watermarkElement = this.element.find(".input-control-watermark");
            if (this.controlValueIsEmpty() === false)
            {
                this.watermarkElement.hide();
            }

            if (this.evaluateRegex(_runtimeIOSMobileRegex, navigator.userAgent) && evalCommon("SourceCode.Forms.Settings.Compatibility.DisablePickerWatermarksOnIOS"))
            {
                this.watermarkElement.addClass("hide-watermark");
            }

            if (!checkExistsNotEmpty(this.watermarkElement.text().trim()))
            {
                this.watermarkElement.addClass("empty");
            }
        },

        value: function (value)
        {
            var tb = this.element.find("input[type='text']");
            tb.val(value);
        },

        inputOnFocus: function (e)
        {
            if ($(e.target).is(this.options.selector))
            {
                this.element.addClass("active");
                this.watermarkElement.hide();
            }
        },

        inputOnBlur: function (e)
        {
            if ($(e.target).is(this.options.selector))
            {
                this.options.focusViaClick = false;
                this.element.removeClass("active");

                if (this.controlValueIsEmpty() === true)
                {
                    this.watermarkElement.show();
                }
            }
        },

        watermarkOnClick: function (e)
        {
            this.options.focusViaClick = true;
            this.element.find(this.options.selector).trigger("focus");
        },

        focus: function ()
        {
            if (!this.element.hasClass("disabled") && !this.element.hasClass("read-only"))
            {
                this.options.focusViaClick = false;
                this.element.find(this.options.selector).trigger("focus");
            }
        },

        //Method to evaluate if the lookupbox has a value or not
        controlValueIsEmpty: function ()
        {
            if (typeof this.options.controlValueIsEmptyMethod === "function" && checkExists(this.options.controlToEvalute))
            {
                return this.options.controlValueIsEmptyMethod(this.options.controlToEvalute);
            }
            var element = this.element.find(this.options.selector);
            return element.val() === "";
        },

        disable: function ()
        {
            this.element.addClass("disabled");
            $.Widget.prototype.disable.apply(this, arguments);
        },

        readonly: function ()
        {
            this.element.addClass("read-only");
            $.Widget.prototype.disable.apply(this, arguments);
        },

        enable: function ()
        {
            this.element.removeClass("disabled");
            if (!this.element.hasClass('read-only'))
            {
                $.Widget.prototype.enable.apply(this, arguments);
            }
        },

        editable: function ()
        {
            this.element.removeClass("read-only");
            if (!this.element.hasClass('disabled'))
            {
                $.Widget.prototype.enable.apply(this, arguments);
            }
        },

        find: function ()
        {
            var returnItem;
            if (arguments[0] === "watermark")
            {
                returnItem = this.watermarkElement;
            }
            return returnItem;
        },

        html: function (options)
        {
            var html = "<div class=\"input-control select-box lookup-box";
            if (options !== undefined && options.disabled !== undefined && options.disabled)
            {
                html += " disabled";
            }
            if (options !== undefined && options.icon !== undefined && options.icon !== "")
            {
                html += " icon-control " + options.icon;
            }

            html += "\"";

            var _id;

            if (options !== null)
            {
                _id = [" id=\"", options.id, "_base", "\""];
            }

            if (_id !== null)
            {
                html += _id.join("");
            }

            html += "><div class=\"input-control-body\">"
                + "<div class=\"input-control-t\"><div class=\"input-control-t-l\"></div>"
                + "<div class=\"input-control-t-c\"></div><div class=\"input-control-t-r\"></div>"
                + "</div><div class=\"input-control-m\"><div class=\"input-control-m-l\"></div>"
                + "<div class=\"input-control-m-c\"><div class=\"input-control-wrapper\">";

            html += "<input type=\"text\" class=\"input-control\"";

            if (_id !== null)
            {
                _id.splice(2, 1);

                html += _id.join('');
            }

            if (options !== undefined && options.value !== undefined && options.value !== "")
            {
                html += " value=\"" + options.value + "\"";
            }

            if (options !== undefined && options.disabled !== undefined && options.disabled)
            {
                html += " disabled=\"disabled\"";
            }
            if (options !== undefined && options.readonly !== undefined && options.readonly)
            {
                html += " readonly=\"readonly\"";
            }

            html += "/>";

            if (options !== undefined && options.watermark !== undefined && options.watermark !== "")
            {
                html += "<div class=\"input-control-watermark\"";
                if (options !== undefined && options.value !== undefined && options.value !== "")
                {
                    html += " style=\"display:none;\"";
                }
                html += ">" + options.watermark + "</div>";
            }

            html += "</div></div><div class=\"input-control-m-r\"></div></div>"
                + "<div class=\"input-control-b\"><div class=\"input-control-b-l\"></div>"
                + "<div class=\"input-control-b-c\"></div><div class=\"input-control-b-r\"></div>"
                + "</div></div>";

            html += "<div class=\"input-control-buttons\">"
                + "<a id=\"" + ((options !== undefined && options.buttonId !== undefined && options.buttonId) ? options.buttonId : "") + "\""
                + " class=\"" + ((options !== undefined && options.buttonIcon !== undefined && options.buttonIcon) ? options.buttonIcon : "ellipsis") + "\" href=\"javascript:;\"><span><span>...</span></span></a>"
                + "</div>";

            html += "</div>";

            return html;

        },

        evaluateRegex: function(regexString, userAgentString)
        {
            return regexString.test(userAgentString);
        }

    };

    if (typeof SCLookupBox === "undefined")
    {
        SCLookupBox = SourceCode.Forms.Controls.LookupBox;
    }

    $.widget("ui.lookupbox", SourceCode.Forms.Controls.LookupBox);

    $.extend($.ui.lookupbox.prototype, { getter: "find" });

    $(function ()
    {
        // Auto init the lookups found in the document
        $(".input-control.lookup-box").lookupbox();

        $(document).on("focus.lookup", ".input-control.lookup-box:not(.disabled):not(.read-only)", function (e)
        {
            $(this).lookupbox().lookupbox("inputOnFocus", e);
        });

        $(document).on("blur.lookup", ".input-control.lookup-box:not(.disabled):not(.read-only)", function (e)
        {
            $(this).lookupbox().lookupbox("inputOnBlur", e);
        });
        // Clicking on the watermark will place focus on the input element
        $(document).on("click.lookup touchstart.lookup", ".input-control.lookup-box:not(.disabled):not(.read-only) .input-control-watermark", function (e)
        {
            $(this).closest(".input-control.lookup-box").lookupbox().lookupbox("watermarkOnClick", e);
        });
    });

})(jQuery);
