(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) { SourceCode = {}; }
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) { SourceCode.Forms = {}; }
    if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) { SourceCode.Forms.Controls = {}; }

    SourceCode.Forms.Controls.CheckboxRadioShared =
    {
        _create: function (type)
        {
            var o = this.options;

            var parentLabel = null;

            if (this.element[0].tagName.toLowerCase() === "label")
            {
                parentLabel = this.element;
                this.element.addClass("input-control");
                if (type != "radio") this.element.addClass("checkbox");
                this.element = $(this.element.children("input")[0]);
            }
            else if (this.element.parent()[0].tagName.toLowerCase() !== "label")
            {
                this.element.wrap("<label class=\"input-control {0}\"></label>".format(type));
                parentLabel = this.element.parent();
            }
            else
            {
                parentLabel = this.element.parent();
                parentLabel.addClass("input-control").addClass(type);
            }

            this.element.addClass("input-control");
            var nativeElement = this.element[0];

            var checked = nativeElement.getAttribute("checked");
            if (checkExists(checked) && checked === "checked")
            {
                parentLabel.addClass("checked");
            }

            if (parentLabel.hasClass("read-only"))
            {
                nativeElement.setAttribute("disabled", "disabled");
            }

            var title = nativeElement.getAttribute("title");
            if ((checkExists(title) && title !== ""))
            {
                nativeElement.setAttribute("title", title);
            }

            if (parentLabel.children(".input-control-img").length === 0)
            {
                parentLabel.append("<span class=\"input-control-img\"></span>");
            }

            if (parentLabel.children(".input-control-text").length === 0)
            {
                var labelText = parentLabel.text();
                var textNode = parentLabel.contents().filter(function () { return this.nodeType === 3; }).remove();
                parentLabel.append("<span class=\"input-control-text\">" + labelText + "</span>");
            }

            if (o.icon !== "")
            {
                parentLabel.addClass("icon-control").addClass(o.icon);
                if (parentLabel.children(".input-control-icon").length === 0)
                {
                    $("<span class=\"input-control-icon\"></span>").insertBefore(parentLabel.children(".input-control-text"));
                }
            }
        },

        html: function (options, type)
        {
            if (!checkExists(options))
            {
                options =
                {
                    checked: false,
                    disabled: false,
                    readonly: false
                };
            }
            var hasNgModel = checkExists(options) && checkExistsNotEmpty(options.ngModel);

            if (!checkExists(options.checked))
            {
                options.checked = false;
            }
            if (!checkExists(options.disabled))
            {
                options.disabled = false;
            }
            if (!checkExists(options.readonly))
            {
                options.readonly = false;
            }

            if (options.checked === "true")
            {
                options.checked = true;
            }
            if (options.checked === "false")
            {
                options.checked = false;
            }
            if (options.disabled === "true")
            {
                options.disabled = true;
            }
            if (options.disabled === "false")
            {
                options.disabled = false;
            }
            if (options.readonly === "true")
            {
                options.readonly = true;
            }
            if (options.readonly === "false")
            {
                options.readonly = false;
            }

            var html = "<label class=\"input-control style-aware " + type;

            if (checkExists(options.icon) && options.icon !== "")
            {
                html += " icon-control " + options.icon;
            }

            if (options.checked === true)
            {
                html += " checked";
            }
            if (options.disabled === true)
            {
                html += " disabled";
            }
            if (options.readonly === true)
            {
                html += " read-only";
            }

            html += "\"";

            if (hasNgModel)
            {
                html += " data-ng-class=\"{checked: {0}}\"".format(options.ngModel);
            }

            if (checkExists(options.description) && options.description !== "")
                html += " title=\"" + options.description.htmlEncode() + "\"";

            var _id = options.id;

            if (checkExists(_id))
            {
                html += " id=\"{0}_base\" for=\"{0}\"".format(_id);
            }

            if (checkExists(options.isJoinOnDisplay) && options.isJoinOnDisplay !== "")
            {
                html += " isJoinOnDisplay =\"{0}\" ".format(options.isJoinOnDisplay);
            }

            html += ">";

            html += "<span class=\"input-control-img\"></span>";

            if (checkExists(options.icon) && options.icon !== "")
            {
                html += "<span class=\"input-control-icon\"></span>";
            }

            //Add runtime style-aware svg
            var listClassName = ".style-aware-{0}-svg".replace("{0}", type);
            if ($(listClassName).length > 0) {
                var checkBoxSvg = $(listClassName + " > svg")[0];
                html += checkBoxSvg.outerHTML;

                //Ensure that there is at least one copy of the cached svg left (one per list will be generated)
                $(listClassName).slice(1).remove();
            }

            html += "<span class=\"input-control-text\">" + (checkExists(options.label) && options.label !== "" ? options.label.htmlEncode() : "") + "</span>";

            html += "<input type=\"{0}\"".format(type);

            if (checkExists(_id))
            {
                html += " id=\"{0}\"".format(_id);
            }

            if (hasNgModel)
            {
                html += " data-ng-model=\"{0}\"".format(options.ngModel);
                html += " data-ng-class=\"{checked: {0}}\"".format(options.ngModel);
            }

            html += " class=\"input-control";

            if (checkExists(options.skipCreateChecks) && options.skipCreateChecks === true)
            {
                html += " sc ";
            }

            html += "\"";

            if (checkExists(options.tabIndex))
            {
                html += " tabindex=\"" + options.tabIndex + "\"";
            }

            if (checkExists(options.value))
            {
                html += " value=\"" + options.value.htmlEncode() + "\"";
            }

            if (checkExists(options.name))
            {
                html += " name=\"" + options.name.htmlEncode() + "\"";
            }

            if (options.checked === true)
            {
                html += " checked=\"checked\"";
            }

            if (options.disabled === true || options.readonly === true)
            {
                html += " disabled=\"disabled\"";
            }

            if (checkExists(options.isChanged))
            {
                html += " isChanged =\"{0}\" ".format(options.isChanged);
            }

            html += "/>";

            html += "</label>";

            return html;

        }
    };

    SourceCode.Forms.Controls.Checkbox = {
        _create: function ()
        {

            if (!this.element.hasClass("sc"))
            {
                SourceCode.Forms.Controls.CheckboxRadioShared._create.apply(this, ["checkbox"]);
            }

            var checkLabel = this.element.closest("label.input-control");

            this.element.on("click", function ()
            {
                if ($(this).is(":checked"))
                {
                    checkLabel.addClass("checked");
                }
                else
                {
                    checkLabel.removeClass("checked");
                }
                return true;
            }).on("focus", function ()
            {
                checkLabel.addClass("focus");
            }).on("blur", function ()
            {
                checkLabel.removeClass("focus");
            });
        },

        focus: function ()
        {
            this.element.trigger("focus");
        },

        disable: function ()
        {
            this.element.prop("disabled", true);
            this.element.parent().addClass("disabled");
            this.element.toggleClass("ui-state-disabled", true);
            $.Widget.prototype.disable.apply(this, arguments);

        },

        enable: function ()
        {
            var parent = this.element.parent();
            parent.removeClass("disabled");
            if (!parent.hasClass('read-only'))
            {
                this.element.prop("disabled", false);
                this.element.toggleClass("ui-state-disabled", false);
                $.Widget.prototype.enable.apply(this, arguments);
            }
        },

        editable: function ()
        {
            var parent = this.element.parent();
            parent.removeClass("read-only");
            if (!parent.hasClass('disabled'))
            {
                this.element.prop("disabled", false);
                this.element.toggleClass("ui-state-disabled", false);
                $.Widget.prototype.enable.apply(this, arguments);
            }
        },
        isChecked: function ()
        {
            return this.element[0].checked;
        },


        check: function ()
        {
            var parent = this.element.parent();

            parent.removeClass("indeterminate");

            this.element.prop("checked", true);
            parent.addClass("checked");

            this.element[0].checked = true;
        },

        setValue: function (value)
        {
            var isChecked = value === true;
            if (isChecked)
            {
                this.check();
            }
            else
            {
                this.uncheck();
            }
        },

        uncheck: function()
        {
            var parent = this.element.parent();

            parent.removeClass("indeterminate");

            this.element.prop("checked", false);
            parent.removeClass("checked");

            this.element[0].checked = false;
        },

        indeterminate: function ()
        {
            var parent = this.element.parent();

            // ensure checked state is removed
            this.element.prop("checked", false);
            parent.removeClass("checked");

            parent.addClass("indeterminate");
        },

        disabled: function ()
        {
            this.element.prop("disabled", true);
            this.element.parent().addClass("disabled");
            this.element.toggleClass("ui-state-disabled", true);
            $.Widget.prototype.disable.apply(this, arguments);
        },

        enabled: function ()
        {
            var parent = this.element.parent();
            parent.removeClass("disabled");
            if (!parent.hasClass('read-only'))
            {
                this.element.prop("disabled", false);
                this.element.toggleClass("ui-state-disabled", false);
                $.Widget.prototype.enable.apply(this, arguments);
            }
        },

        readonly: function ()
        {
            this.element.prop("disabled", true);
            this.element.parent().addClass("read-only");
            //this.element.prop("aria-disabled", true);
            this.element.toggleClass("ui-state-disabled", true);
            $.Widget.prototype.disable.apply(this, arguments);
        },

        html: function (options)
        {
            return SourceCode.Forms.Controls.CheckboxRadioShared.html.apply(this, [options, "checkbox"]);
        }
    };

    if (typeof SCCheckbox === "undefined") { SCCheckbox = SourceCode.Forms.Controls.Checkbox; }

    $.widget("ui.checkbox", SourceCode.Forms.Controls.Checkbox);

    $.extend($.ui.checkbox.prototype, {
        options: {
            icon: ""
        }
    });

    SourceCode.Forms.Controls.Radiobutton = {
        _create: function ()
        {
            var radioLabel = this.element.closest("label.input-control");

            if (!this.element.hasClass("sc"))
            {
                SourceCode.Forms.Controls.CheckboxRadioShared._create.apply(this, ["radio"]);
            }
            this.element.on("click", function ()
            {
                this.check();
                radioLabel.trigger("focus");
            }.bind(this)).on("focus", function ()
            {
                radioLabel.addClass("focus");
                this._trigger("focus");
            }.bind(this)).on("blur", function ()
            {
                radioLabel.removeClass("focus");
            });
        },

        focus: function ()
        {
            this.element.trigger("focus");
        },

        check: function ()
        {
            var name = this.element.prop("name");
            var hasName = checkExistsNotEmpty(name);
            var sameNameSiblings = (hasName) ? $("input.input-control[type=radio][name='{0}']".format(name)) : [];

            var siblings = sameNameSiblings.length > 0 ? sameNameSiblings : this.element.closest("ul").find("li label");
            siblings.prop("checked", false);
            siblings.closest("label.input-control.radio").removeClass("checked");

            this.element.prop("checked", true);
            this.element.closest("label.input-control").addClass("checked");

            this._trigger("change");
        },

        uncheck: function ()
        {
            this.element.prop("checked", false);
            this.element.closest("label.input-control").removeClass("checked");
        },

        disable: function ()
        {

            this.element.prop("disabled", true);
            this.element.parent().addClass("disabled");
            this.element.toggleClass("ui-state-disabled", true);
            $.Widget.prototype.disable.apply(this, arguments);

        },

        readonly: function ()
        {

            this.element.prop("disabled", true);
            this.element.toggleClass("ui-state-disabled", true);
            this.element.parent().addClass("read-only");
            $.Widget.prototype.disable.apply(this, arguments);

        },

        enable: function ()
        {

            var parent = this.element.parent();
            parent.removeClass("disabled");
            if (!parent.hasClass('read-only'))
            {
                this.element.prop("disabled", false);
                this.element.toggleClass("ui-state-disabled", false);
                $.Widget.prototype.enable.apply(this, arguments);
            }

        },

        editable: function ()
        {

            var parent = this.element.parent();
            parent.removeClass("read-only");
            if (!parent.hasClass('disabled'))
            {
                this.element.prop("disabled", false);
                this.element.toggleClass("ui-state-disabled", false);
                $.Widget.prototype.enable.apply(this, arguments);
            }

        },

        disabled: function ()
        {

            this.element.prop("disabled", true);
            this.element.parent().addClass("disabled");

        },

        enabled: function ()
        {

            this.element.prop("disabled", false);
            this.element.parent().removeClass("disabled");
            this.element.parent().removeClass("read-only");
        },

        html: function (options)
        {
            return SourceCode.Forms.Controls.CheckboxRadioShared.html.apply(this, [options, "radio"]);
        },

        destroy: function ()
        {
            this.element.off().removeData();
        }
    };

    if (typeof SCRadiobutton === "undefined") { SCRadiobutton = SourceCode.Forms.Controls.Radiobutton; }

    $.widget("ui.radiobutton", SourceCode.Forms.Controls.Radiobutton);

    $.extend($.ui.radiobutton.prototype, {
        options: {
            icon: ""
        }
    });

    SourceCode.Forms.Controls.CheckboxGroup = {

        disable: function ()
        {
            this.element.find("input[type=checkbox]").checkbox("disable");
            $.Widget.prototype.disable.apply(this, arguments);

        },

        enable: function ()
        {
            this.element.find("input[type=checkbox]").checkbox("enable");
            $.Widget.prototype.enable.apply(this, arguments);

        },

        check: function ()
        {
            if (typeof arguments[0] !== "undefined")
            {
                this.element.find("input[type=checkbox]").eq(arguments[0]).checkbox("check");
            } else
            {
                this.element.find("input[type=checkbox]").checkbox("check");
            }

        },

        uncheck: function ()
        {
            this.element.find("input[type=checkbox]").checkbox("uncheck");

        },

        html: function (options)
        {
            if (typeof options.collapsed === "undefined" || options.collapsed === null) { options.collapsed = false; }

            var html = "<ul class=\"input-control-group checkbox";

            if (options.collapsed) { html += " collapsed"; }

            html += "\"";

            if (typeof options.id !== "undefined" && options.id !== "") { html += " id=\"" + options.id + "\""; }

            html += "></ul>";

            return html;

        },

        add: function ()
        {

            //console.log(arguments[0]);

            var html = "<li>" + SCCheckbox.html(arguments[0]) + "</li>";

            if (typeof arguments[1] !== "undefined" && !isNaN(parseInt(arguments[1], 10)))
            {
                $(html).insertBefore(this.element.children("li").eq(arguments[1])).find("input[type=checkbox]").checkbox();
            } else
            {
                $(html).appendTo(this.element).find("input[type=checkbox]").checkbox();
            }

        },

        clear: function ()
        {
            this.element.find("input[type=checkbox]").checkbox("destroy");
            this.element.children("li").remove();
        },

        hasItems: function ()
        {
            return this.element.children("li").length > 0;
        }
    };

    if (typeof SCCheckboxGroup === "undefined") { SCCheckboxGroup = SourceCode.Forms.Controls.CheckboxGroup; }

    $.widget("ui.checkboxgroup", SourceCode.Forms.Controls.CheckboxGroup);

    SourceCode.Forms.Controls.RadiobuttonGroup = {

        disable: function ()
        {

            this.element.find("input[type=radio]").radiobutton("disable");
            $.Widget.prototype.disable.apply(this, arguments);

        },

        enable: function ()
        {

            this.element.find("input[type=radio]").radiobutton("enable");
            $.Widget.prototype.enable.apply(this, arguments);

        },

        clear: function ()
        {
            //Clear all radiobuttons and default to the first radiobutton
            var radioButtons = $(this.element).closest("ul").find("li label");
            radioButtons.removeClass("checked");
            radioButtons.eq(0).addClass("checked");
        },

        value: function (label)
        {
            //Get or set the value of the radiobutton group
            if (checkExists(label))
            {
                var radioButtons = $(this.element).closest("ul").find("li label");
                radioButtons.removeClass("checked");
                radioButtons.each(
                    function ()
                    {
                        if ($(this).text() === label)
                        {
                            $(this).addClass("checked");
                            return;
                        }
                    });
            }
            else
            {
                var radioButton = $(this.element).closest("ul").find("li label.checked");
                return radioButton.text();
            }
        },

        html: function (options)
        {

            if (typeof options.collapsed === "undefined" || options.collapsed === null) { options.collapsed = false; }

            var html = "<ul class=\"input-control-group radio";

            if (options.collapsed) { html += " collapsed"; }

            html += "\"";

            if (typeof options.id !== "undefined" && options.id !== "") { html += " id=\"" + options.id + "\""; }

            html += "></ul>";

            return html;

        },

        add: function ()
        {

            var html = "<li>" + SCRadiobutton.html(arguments[0]) + "</li>";
            var radioBtnOptions =
            {
                change: function () { this._trigger("change"); }.bind(this),
                focus: function () { this._trigger("focus"); }.bind(this)
            };

            if (typeof arguments[1] !== "undefined" && !isNaN(parseInt(arguments[1], 10)))
            {
                $(html).insertBefore(this.element.children("li").eq(arguments[1])).find("input[type=checkbox]").radiobutton(radioBtnOptions);
            } else
            {
                $(html).appendTo(this.element).find("input[type=radio]").radiobutton(radioBtnOptions);
            }
        }
    };

    if (typeof SCRadiobuttonGroup === "undefined") { SCRadiobuttonGroup = SourceCode.Forms.Controls.RadiobuttonGroup; }

    $.widget("ui.radiobuttongroup", SourceCode.Forms.Controls.RadiobuttonGroup);

    $(function ()
    {

        $("input.input-control[type=checkbox]").checkbox();
        $("input.input-control[type=radio]:not(.rbs)").radiobutton();
        $(".input-control-group.checkbox").checkboxgroup();
        $(".input-control-group.radio").radiobuttongroup();

    });

})(jQuery);
