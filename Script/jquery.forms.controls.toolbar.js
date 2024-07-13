(function ($)
{

	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

	SourceCode.Forms.Controls.ToolbarGroup = {

		_create: function ()
		{

			var o = this.options;

			if (!this.element.hasClass("toolbars"))
			{
				this.element.addClass("toolbars");
			}

			this.toolbars = null;

			switch (this.element.children(".toolbar:not(.hidden)").length)
			{
				case 1:
					this.element.addClass("single").removeClass("double").removeClass("triple");
					break;
				case 2:
					this.element.addClass("double").removeClass("single").removeClass("triple");
					break;
				case 3:
					this.element.addClass("triple").removeClass("double").removeClass("single");
					break;
			}

			if (this.element.children(".toolbar").length > 0) this.toolbars = this.element.children(".toolbar").toolbar();

			if (SourceCode.Forms.Browser.msie)
			{
				var tbButtons = this.element.find(".toolbar-button");
				var ltb = tbButtons.length;
				while (ltb--)
				{
					tbButtons[ltb].setAttribute("onclick", "return false");
				}
			}

		},

		html: function (options)
		{

			if (typeof options === "undefined" || options === null) options = { toolbars: 0 };

			var html = "<div class=\"toolbars";

			switch (options.toolbars)
			{
				case 1:
					html += " single";
					break;
				case 2:
					html += " double";
					break;
				case 3:
					html += " triple";
					break;
			}

			html += "\"";

			if (typeof options.id !== "undefined" && options.id !== "") html += " id=\"" + options.id + "\"";

			html += ">";
			for (var i = 0; i < options.toolbars; i++)
			{
				var toolbarOptions = {};
				if (checkExists(options.toolbarOptions) && checkExists(options.toolbarOptions[i]))
				{
					toolbarOptions = options.toolbarOptions[i]
				}
				if (options.toolbars > 2 && (i + 1) === options.toolbars)
				{

					toolbarOptions.alignment = "bottom";
				}
				html += SourceCode.Forms.Controls.Toolbar.html(toolbarOptions);

			}

			html += "</div>";

			return html;

		},

		fetch: function ()
		{
			if (arguments[0] === "toolbars")
			{
				var toolbars = this.element.children(".toolbar");
				return this.toolbars = (toolbars.length > 0) ? toolbars.toolbar() : null;
			}
		},

		addtoolbar: function (options)
		{

			if (this.fetch("toolbars") === null || (this.fetch("toolbars") !== null && this.fetch("toolbars").length < 3))
			{

				$(SourceCode.Forms.Controls.Toolbar.html(options)).appendTo(this.element).toolbar();
				this.toolbars = this.element.children(".toolbar").toolbar();

			}

			switch (this.fetch("toolbars").filter(":visible").length)
			{
				case 1:
					this.element.addClass("single").removeClass("double").removeClass("triple");
					break;
				case 2:
					this.element.addClass("double").removeClass("single").removeClass("triple");
					break;
				case 3:
					this.element.addClass("triple").removeClass("double").removeClass("single");
					break;
			}

		},

		hideAllButtons: function (){
			this.element.find(".toolbar-button").hide();
		},

		hide: function ()
		{
			var relevantToolbar = this.toolbars[arguments[0]];
			if (checkExists(relevantToolbar))
			{
				relevantToolbar.style.display = "none";
				$(relevantToolbar).addClass("hidden");
			}
			var visibleToolbarLength = this.toolbars.filter(
				function ()
				{
					return this.style.display !== "none";
				}).length;

			switch (visibleToolbarLength)
			{
				case 0:
					this.element.addClass("none").removeClass("single").removeClass("double").removeClass("triple");
					break;
				case 1:
					this.element.addClass("single").removeClass("none").removeClass("double").removeClass("triple");
					break;
				case 2:
					this.element.addClass("double").removeClass("none").removeClass("single").removeClass("triple");
					break;
				case 3:
					this.element.addClass("triple").removeClass("none").removeClass("double").removeClass("single");
					break;
			}

		},

		unhide: function ()
		{
			var relevantToolbar = this.toolbars[arguments[0]];
			if (checkExists(relevantToolbar))
			{
				relevantToolbar.style.display = "";
				$(relevantToolbar).removeClass("hidden");
			}
			var visibleToolbarLength = this.toolbars.filter(
				function ()
				{
					return this.style.display !== "none";
				}).length;

			switch (visibleToolbarLength)
			{
				case 0:
					this.element.addClass("none").removeClass("single").removeClass("double").removeClass("triple");
					break;
				case 1:
					this.element.addClass("single").removeClass("none").removeClass("double").removeClass("triple");
					break;
				case 2:
					this.element.addClass("double").removeClass("none").removeClass("single").removeClass("triple");
					break;
				case 3:
					this.element.addClass("triple").removeClass("none").removeClass("double").removeClass("single");
					break;
			}

		}

	};

	SourceCode.Forms.Controls.Toolbar = {

		_create: function ()
		{

			var o = this.options;

			if (this.element.hasClass("toolbar"))
			{
				this.toolbar = this.element;
			} else
			{
				this.toolbar = $(this.html(o)).appendTo(this.element);
				this.element = this.toolbar;
			}

			this.body = this.element.find(".toolbar-wrapper").eq(0);

			var buttons = this.body.find("a.toolbar-button");
			buttons.k2button();
			buttons.on("click", this.checkForDisabledOnClick);

		},

		checkForDisabledOnClick: function (e)
		{
			var jqTarget = $(e.target);
			var button = jqTarget.closest("a.toolbar-button");
			if (button.is(".disabled"))
			{
				e.stopImmediatePropagation();
				e.stopPropagation();
			}
		},

		html: function (options)
		{

			if (typeof options === "undefined" || options === null) options = {};

			var html = "<div";

			if (typeof options.id !== "undefined" && options.id !== "") html += " id=\"" + options.id + "\"";

			html += " class=\"toolbar";

			if (typeof options.alignment !== "undefined" && options.alignment !== "")
			{
				switch (options.alignment)
				{
					case "top":
						html += " top-aligned";
						break;
					case "bottom":
						html += " bottom-aligned";
						break;
				}
			}

			html += "\"><div class=\"toolbar-wrapper\">";
			if (checkExists(options.buttons))
			{
				var l = options.buttons.length;
				for (var i = 0; i < l; i++)
				{
					html += this._buttonHTML(options.buttons[i]);
				}
			}
			html += "</div></div>";

			return html;

		},

		add: function ()
		{
			switch (arguments[0])
			{
				case "button":
					this._addButton(arguments[1]);
					break;
				case "divider":
					this._addDivider(arguments[1]);
					break;
				case "group":
					this._addGroup(arguments[1]);
					break;
			}
		},

		_buttonHTML: function (options)
		{
			var html = "<a href=\"" + ((typeof options.href !== "undefined" && options.href !== "") ? options.href : "javascript:;") + "\""
				+ " class=\"toolbar-button";

			var enabled = true;

			if (typeof options.selected !== "undefined" && options.selected) html += " selected";
			if (typeof options.disabled !== "undefined" && options.disabled)
			{
				html += " disabled";
				enabled = false;
			}
			if (typeof options.icon !== "undefined" && options.icon !== "") html += " " + options.icon;

			html += "\"";

			if (typeof options.id !== "undefined" && options.id !== "") html += " id=\"" + options.id + "\"";

			if (checkExists(options.tabIndex))
			{
				if (enabled)
				{
					html += " tabindex=\"" + options.tabIndex + "\"";
				}
				else
				{
					html += " tabindex=\"-1\"";
				}
			}

			if (SourceCode.Forms.Browser.msie) html += " onclick=\"return false;\"";

			if ((typeof options.text !== "undefined" && options.text !== "") || (typeof options.description !== "undefined" && options.description !== ""))
			{
				html += " title=\"" + ((typeof options.description !== "undefined" && options.description !== "") ? options.description : options.text) + "\"";
			}

			html += "><span class=\"button-l\"></span><span class=\"button-c\">";

			if (typeof options.icon !== "undefined" && options.icon !== "") html += "<span class=\"button-icon\"></span>";

			if (typeof options.text !== "undefined" && options.text !== "")
			{
				html += "<span class=\"button-text\">" + options.text + "</span>";
			}

			html += "</span><span class=\"button-r\"></span></a>";
			return html;
		},

		_bindButtons: function ()
		{
			this.body.find("a.toolbar-button").on("click", this.checkForDisabledOnClick);
		},

		_addButton: function (options)
		{
			var html = this._buttonHTML(options);
			if (typeof options.group !== "undefined" && options.group !== null)
			{
				if (options.group.children(":last-child").hasClass("toolbar-button")) this._addDivider({ group: options.group });
				options.group.append(html);
			} else
			{
				if (this.body.children(":last-child").hasClass("toolbar-button")) this._addDivider();
				this.body.append(html);
			}
			this._bindButtons();
		},

		_addDivider: function (options)
		{

			if (typeof options === "undefined") options = {};

			var html = "<div class=\"toolbar-divider\"";

			if (typeof options.id !== "undefined" && options.id !== "") html += " id=\"" + options.id + "\"";

			html += "></div>";

			if (typeof options.group !== "undefined" && options.group !== null)
			{
				options.group.append(html);
			} else
			{
				this.body.append(html);
			}

		},

		_addGroup: function (options)
		{

			if (typeof options === "undefined") options = {};

			var html = "<div class=\"toolbar-controls-group\"";

			if (typeof options.id !== "undefined" && options.id !== "") html += " id=\"" + options.id + "\"";

			html += ">";

			if (typeof options.label !== "undefined" && options.label !== "") html += "<div class=\"toolbar-controls-group-label\">" + options.label + "</div>";

			html += "</div>";

			this.body.append(html);

		},

		fetch: function ()
		{
			switch (arguments[0])
			{
				case "buttons":
					return this.body.find("a.toolbar-button");
					break;
				case "dividers":
					return this.body.find(".toolbar-divider");
					break;
				case "groups":
					return this.body.find(".toolbar-controls-group");
					break;
			}
		},

		remove: function ()
		{
			switch (arguments[0])
			{
				case "buttons":
					if (typeof arguments[1] !== "undefined")
					{
						for (var i = 0, j = arguments[1].length; i < j; i++)
						{
							this.body.find("a.toolbar-button").eq(arguments[1][i]).remove();
						}
					} else
					{
						this.body.find("a.toolbar-button").remove();
					}
					break;
				case "dividers":
					if (typeof arguments[1] !== "undefined")
					{
						for (var i = 0, j = arguments[1].length; i < j; i++)
						{
							this.body.find(".toolbar-divider").eq(arguments[1][i]).remove();
						}
					} else
					{
						this.body.find(".toolbar-divider").remove();
					}
					break;
				case "groups":
					if (typeof arguments[1] !== "undefined")
					{
						for (var i = 0, j = arguments[1].length; i < j; i++)
						{
							this.body.find(".toolbar-controls-group").eq(arguments[1][i]).remove();
						}
					} else
					{
						this.body.find(".toolbar-controls-group").remove();
					}
					break;
			}
		},

		disable: function ()
		{
			switch (arguments[0])
			{
				case "buttons":

					if (typeof arguments[1] !== "undefined")
					{
						for (var i = 0, j = arguments[1].length; i < j; i++)
						{
							this.body.find("a.toolbar-button").eq(arguments[1][i]).addClass("disabled");
						}
					} else
					{
						this.body.find("a.toolbar-button").addClass("disabled");
					}

					break;
				case "groups":
					if (typeof arguments[1] !== "undefined")
					{
						for (var i = 0, j = arguments[1].length; i < j; i++)
						{
							this.body.find(".toolbar-controls-group").eq(arguments[1][i]).children("a.toolbar-button").addClass("disabled");
						}
					} else
					{
						this.body.find(".toolbar-controls-group").children("a.toolbar-button").addClass("disabled");
					}
					break;
			}
		},

		enable: function ()
		{
			switch (arguments[0])
			{
				case "buttons":

					if (typeof arguments[1] !== "undefined")
					{
						for (var i = 0, j = arguments[1].length; i < j; i++)
						{
							this.body.find("a.toolbar-button").eq(arguments[1][i]).removeClass("disabled");
						}
					} else
					{
						this.body.find("a.toolbar-button").removeClass("disabled");
					}

					break;
				case "groups":
					if (typeof arguments[1] !== "undefined")
					{
						for (var i = 0, j = arguments[1].length; i < j; i++)
						{
							this.body.find(".toolbar-controls-group").eq(arguments[1][i]).children("a.toolbar-button").removeClass("disabled");
						}
					} else
					{
						this.body.find(".toolbar-controls-group").children("a.toolbar-button").removeClass("disabled");
					}
					break;
			}
		}

	};

	if (typeof SCToolbarGroup === "undefined") SCToolbarGroup = SourceCode.Forms.Controls.ToolbarGroup;
	if (typeof SCToolbar === "undefined") SCToolbar = SourceCode.Forms.Controls.Toolbar;

	$.widget("ui.toolbargroup", SourceCode.Forms.Controls.ToolbarGroup);
	$.widget("ui.toolbar", SourceCode.Forms.Controls.Toolbar);

	$.extend($.ui.toolbargroup.prototype, {
		getter: "fetch"
	});

	$.extend($.ui.toolbar.prototype, {
		getter: "fetch"
	});

})(jQuery);
