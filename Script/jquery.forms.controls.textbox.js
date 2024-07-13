(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

    SourceCode.Forms.Controls.Textbox =
    {
        _create: function ()
        {
            var parent = this.element;
            if (this.element.hasClass("input-control") && this.element.hasClass("text-input"))
            {
                var element = this.element.find("input[type=text], input[type=password], textarea").eq(0);
                if (element.length > 0) // sometimes non-text elements will come through here. This is just a safe way to handle them for now
                {
                    this.element = element;
                }
                else
                {
                    return this;
                }
            }
            else
            {
                parent = this.element.parent().closest(".input-control");
            }
            var nativeElement = this.element[0];
            var waterMark = this.element.siblings(".input-control-watermark");

            if (this.element.prop("disabled"))
            {
                parent.addClass("disabled");
            }

            if (this.element.prop("readonly"))
            {
                parent.addClass("read-only");
            }

            this._waterMark = waterMark;
            this._parent = parent;

            this.bind();

            if (SourceCode.Forms.Browser.msie) this.element.closest(".input-control-wrapper").addClass("msie");
            if (SourceCode.Forms.Browser.safari) this.element.closest(".input-control-wrapper").addClass("webkit");

            // Textarea Fix for Mozilla
            if (SourceCode.Forms.Browser.mozilla && nativeElement.tagName.toUpperCase() === "TEXTAREA")
            {
                var r = this.element.attr("rows");
                if (r !== "") this.element.css("height", (parseInt(r) * 1.2) + "em");
            }

            window.setTimeout(function ()
            {
                if (this.element.val() !== "")
                {
                    if (waterMark.length > 0)
                    {
                        waterMark.hide();
                    }
                }
            }.bind(this), 150);

            // IE 8 is being difficult about using this.element[0].getAttribut, as this.element[0] doesn't exist in IE8 land. Using jQuery instead
            this.specifiedTabIndex = nativeElement.getAttribute('tabindex');
        },

        bind: function ()
        {
            var waterMark = this._waterMark;
            var parent = this._parent;

            this.element.on("focus.textbox", function ()
            {
                if (!this._parent.hasClass('read-only'))
                {
                    this._parent.addClass("active");
                    this._waterMark.hide();
                }
            }.bind(this)).on("blur.textbox", function ()
            {
                parent.removeClass("active");
                if ($(this).val() === "") waterMark.show();
            }).on("change.textbox", function ()
            {
                if ($(this).val() === "")
                {
                    waterMark.show();
                }
                else
                {
                    waterMark.hide();
                }
            });

            this.element.on("keydown", function (ev)
            {
                this._trigger("keydown", ev);
            }.bind(this));

            this._waterMark.on("click", function ()
            {
                if (!$(this).siblings("input, textarea").prop("disabled") &&
                    !$(this).siblings("input, textarea").prop("readonly"))
                {
                    $(this).hide();
                    $(this).siblings("input, textarea").first().trigger("focus");
                }
            });
        },

        disable: function ()
        {
            this.element.prop("disabled", true);
            this.element.closest(".input-control.text-input").eq(0).addClass("disabled");

            this.specifiedTabIndex = this.element[0].getAttribute('tabindex');
            this.element[0].setAttribute('tabindex', "-1");
        },

        readonly: function ()
        {

            this.element.prop("readonly", true);
            this.element.closest(".input-control.text-input").eq(0).addClass("read-only");

        },

        enable: function ()
        {

            this.element.prop("disabled", false);
            this.element.closest(".input-control.text-input").eq(0).removeClass("disabled");

            this.element[0].setAttribute('tabindex', this.specifiedTabIndex);

        },

        editable: function ()
        {
            this.element.prop("readonly", false);
            this.element.closest(".input-control.text-input").eq(0).removeClass("read-only");
        },

        find: function ()
        {

            switch (arguments[0])
            {
                case "watermark":
                    return this.element.siblings(".input-control-watermark");
                    break;
                case "element":
                    return jQuery(this.element);
                    break;
            }

        },

        setReadOnly: function (value)
        {
            if (value === true)
            {
                this.readonly();
            }
            else if (value === false)
            {
                this.editable();
            }
        },

        setToolTip: function (value)
        {
            if (checkExistsNotEmpty(value))
            {
                var parent = this.element.closest(".input-control.text-input");

                if ((parent.length !== 0) && checkExistsNotEmpty(parent[0].getAttribute("title")))
                {
                    parent[0].removeAttribute("title");
                }

                this.element[0].setAttribute("title", value);
            }
        },

        getValue: function ()
        {
            return jQuery(this.element).val();
        },

        setValue: function ()
        {
            jQuery(this.element).val(arguments[0]);
        },

        getWatermark: function ()
        {
            var el = this.find("watermark");
            return el.text();
        },

        setWatermark: function ()
        {
            var el = this.find("watermark");
            el.text(arguments[0]);
        },

        showWatermark: function ()
        {
            var el = this.find("watermark");
            el.show();
        },

        hideWatermark: function ()
        {
            var el = this.find("watermark");
            el.hide();
        },

        html: function (options)
        {
            //TODO: TD 0001
            var html = "<div class=\"input-control text-input";

            if (options !== undefined && options.icon !== undefined && options.icon !== "")
                html += " icon-control " + options.icon;

            if (options !== undefined && options.disabled !== undefined && options.disabled)
                html += " disabled";

            if (options !== undefined && options.cssClass !== undefined && options.cssClass != "")
                html += " " + options.cssClass;

            html += "\">";

            html += "<div class=\"input-control-t\"><div class=\"input-control-t-l\"></div>"
                + "<div class=\"input-control-t-c\"></div><div class=\"input-control-t-r\"></div></div>"
                + "<div class=\"input-control-m\"><div class=\"input-control-m-l\"></div>"
                + "<div class=\"input-control-m-c\">";

            html += "<div class=\"input-control-wrapper" + (SourceCode.Forms.Browser.msie ? " msie" : (SourceCode.Forms.Browser.safari ? " webkit" : "")) + "\">";

            var metaArray = {};
            if (options !== undefined && options.rows !== undefined && parseInt(options.rows) > 1)
            {

                html += "<textarea cols=\"\" rows=\"" + options.rows + "\" class=\"input-control";
                if (options !== undefined && options.watermark !== undefined && options.watermark !== "")
                {
                    metaArray = {};
                    metaArray["watermark"] = options.watermark;
                    html += "\" data-options=\"" + jQuery.toJSON(metaArray).htmlEncode();
                }
                html += "\"";

                if (options !== undefined && options.id !== undefined && options.id !== "") html += " id=\"" + options.id + "\"";
                if (options !== undefined && options.disabled !== undefined && options.disabled) html += " disabled=\"disabled\"";
                if (options !== undefined && options.readonly !== undefined && options.readonly) html += " readonly=\"readonly\"";
                if (options !== undefined && options.description !== undefined && options.description !== "") html += " title=\"" + options.description.htmlEncode() + "\"";

                html += ">";

                if (options !== undefined && options.value !== undefined && options.value !== "")
                {
                    if (typeof options.value === "string")
                    {
                        html += options.value.htmlEncode();
                    }
                    else
                    {
                        html += options.value;
                    }
                }

                html += "</textarea>";

            } else
            {

                html += "<input type=\"" + (options !== undefined && options.password !== undefined && options.password ? "password" : "text") + "\" class=\"input-control";
                if (options !== undefined && options.watermark !== undefined && options.watermark !== "")
                {
                    metaArray = {};
                    metaArray["watermark"] = options.watermark;
                    html += "\" data-options=\"" + jQuery.toJSON(metaArray).htmlEncode();
                }
                html += "\"";

                if (checkExists(options) && checkExistsNotEmpty(options.ngModel))
                {
                    html += "data-ng-model=\"{0}\"".format(options.ngModel);
                }
                if (options !== undefined && options.id !== undefined && options.id !== "") html += " id=\"" + options.id + "\"";

                if (options !== undefined && options.value !== undefined && options.value !== "")
                {
                    if (typeof options.value === "string")
                    {
                        html += " value=\"" + options.value.htmlEncode() + "\"";
                    }
                    else
                    {
                        html += " value=\"" + options.value + "\"";
                    }
                }
                if (options !== undefined && options.disabled !== undefined && options.disabled) html += " disabled=\"disabled\"";
                if (options !== undefined && options.readonly !== undefined && options.readonly) html += " readonly=\"readonly\"";
                if (options !== undefined && options.description !== undefined && options.description !== "") html += " title=\"" + options.description.htmlEncode() + "\"";

                html += "/>";

            }

            if (options !== undefined && options.watermark !== undefined && options.watermark !== "")
            {
                html += "<div class=\"input-control-watermark\"";
                if (options !== undefined && options.value !== undefined && options.value !== "") html += " style=\"display:none;\"";
                html += ">" + options.watermark.htmlEncode() + "</div>";
            }

            html += "</div>";

            html += "</div><div class=\"input-control-m-r\"></div></div>";

            html += "<div class=\"input-control-b\"><div class=\"input-control-b-l\"></div>"
                + "<div class=\"input-control-b-c\"></div><div class=\"input-control-b-r\"></div></div>";

            html += "</div>";

            return html;

        }

    };

    if (typeof SCTextbox === "undefined") SCTextbox = SourceCode.Forms.Controls.Textbox;

    $.widget("ui.textbox", SourceCode.Forms.Controls.Textbox);

    $(document).ready(function ()
    {
        $(".input-control.text-input").filter(
            function (index)
            {
                return !$(this).hasClass("SFC");
            }).textbox();
    });

    $.extend($.ui.textbox, {
        getter: "find getValue",
        setter: "setValue"
    });

})(jQuery);
