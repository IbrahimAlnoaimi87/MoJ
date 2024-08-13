(function ($)
{

	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

	SourceCode.Forms.Controls.Panel = {

		_create: function ()
		{

			var o = this.options;

			var container = null, panel = null;

			if (this.element.hasClass("panel"))
			{
				this.panel = this.element;

			}
			else
			{
				this.panel = $(this.html(o)).appendTo(this.element.parent());
				this.panel.find(".panel-body-wrapper .wrapper, .panel-body-wrapper .scroll-wrapper").append(this.element);
			}
			this.header = null;
			this.body = null;
			this.footer = null;
			this.toolbars = null;

			var panelChildren = this.panel.children();
			var childIndex = panelChildren.length;
			var jqPanelHeaderControl = null;
			while (childIndex--)
			{
				var child = $(panelChildren[childIndex]);
				if (this.header === null && child.hasClass("panel-header"))
				{

					jqPanelHeaderControl = child;
					this.header = child.find(".panel-header-text");
					if (this.header.length === 0)
					{
						this.header = null;
					}
					else
					{
						this.header = $(this.header[0]);
					}
				}
				else if (this.body === null && child.hasClass("panel-body"))
				{
					this.body = child.find(".panel-body-wrapper > .scroll-wrapper, .panel-body-wrapper > .wrapper");
					if (this.body.length === 0)
					{
						this.body = null;
					}
					else
					{
						this.body = $(this.body[0]);
					}
				}
				else if (this.footer === null && child.hasClass("panel-footer"))
				{
					this.footer = child.find(".toolbar-wrapper");
					if (this.footer.length === 0)
					{
						this.footer = null;
					}
					else
					{
						this.footer = $(this.footer[0]);
					}
				}
				else if (this.toolbars === null && child.hasClass("panel-body"))
				{
					this.toolbars = child.find(".toolbar-wrapper");
					if (this.toolbars.length === 0)
					{
						this.toolbars = null;
					}
					else
					{
						this.toolbars = $(this.toolbars[0]);
					}
				}
			}

			var self = this;
			if (checkExists(jqPanelHeaderControl) && jqPanelHeaderControl.length > 0)
			{
				if (!SourceCode.Forms.Layout.isRuntime())
				{
					$("a", jqPanelHeaderControl).on("click", function ()
					{
						if ($(this).is(".collapse-vertical"))
						{
							self.collapse();
						}
						else if ($(this).is(".expand-vertical"))
						{
							self.expand();
						}
					});
				}

				this.specifiedTabIndex = jqPanelHeaderControl[0].getAttribute('tabindex');
				this.currentTabIndex = this.specifiedTabIndex;
			}
		},

		collapse: function (raiseEvent)
		{
			if (!this.element.hasClass("collapsed"))
			{
				this.element.addClass("collapsed");
				this.element.children(".panel-header").find(".collapse-vertical").removeClass("collapse-vertical").addClass("expand-vertical");
				SourceCode.Forms.Layout.checkAndFixView(this.element);

				if (raiseEvent !== false)
				{
					this._trigger("collapse");
				}
			}
		},

		destroy: function ()
		{
			$.Widget.prototype.destroy.apply(this, arguments);
		},

		expand: function (raiseEvent)
		{
			if (this.element.hasClass("collapsed"))
			{
				this.element.removeClass("collapsed");
				this.element.children(".panel-header").find(".expand-vertical").removeClass("expand-vertical").addClass("collapse-vertical");
				SourceCode.Forms.Layout.checkAndFixView(this.element);

				if (raiseEvent !== false)
				{
					this._trigger("expand");
				}
			}
		},

		html: function (options)
		{

			if (typeof options === "undefined") options = { toolbars: 0, scrolling: false, footer: false, fullsize: false };

			var html = "<div class=\"panel";

			html += (typeof options.scrolling !== "undefined" && options.scrolling) ? " scroll-contents" : "";
			html += (typeof options.header !== "undefined" && options.header !== "") ? " with-header" : " without-header";
			html += (typeof options.footer !== "undefined" && options.footer) ? " with-footer" : " without-footer";
			html += (typeof options.fullsize !== "undefined" && options.fullsize) ? " full" : "";

			if (typeof options.toolbars === "undefined") options.toolbars = 0;

			switch (options.toolbars)
			{
				case 1:
					html += " with-toolbar";
					break;
				case 2:
					html += " with-double-toolbar";
					break;
				case 3:
					html += " with-triple-toolbar";
					break;
				default:
					html += " without-toolbar";
			}

			html += "\"";
			if (options.id) html += " id=\"" + options.id + "\"";

			html += ">";

			if (typeof options.header !== "undefined" && options.header !== "")
			{
				html += "<div class=\"panel-header\"><div class=\"panel-header-l\"></div>"
					+ "<div class=\"panel-header-c\"><div class=\"panel-header-wrapper\">"
					+ "<div class=\"panel-header-text\">" + options.header + "</div></div></div>"
					+ "<div class=\"panel-header-r\"></div></div>";
			}

			if (options.toolbars > 0)
			{
				html += "<div class=\"panel-toolbars\"><div class=\"toolbars";

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

				html += "\">";

				for (var i = 0; i < options.toolbars; i++)
				{
					html += "<div class=\"toolbar\"><div class=\"toolbar-wrapper\"></div></div>";
				}



				html += "</div></div>";
			}

			html += "<div class=\"panel-body\"><div class=\"panel-body-t\"><div class=\"panel-body-t-l\"></div>"
				+ "<div class=\"panel-body-t-c\"></div><div class=\"panel-body-t-r\"></div></div>"
				+ "<div class=\"panel-body-m\"><div class=\"panel-body-m-l\"></div><div class=\"panel-body-m-c\">"
				+ "<div class=\"panel-body-wrapper\">"
				+ "<div class=\"" + ((typeof options.scrolling !== "undefined" && options.scrolling) ? "scroll-wrapper" : "wrapper") + "\">" + ((typeof options.content !== "undefined" && options.content) ? options.content : "") + "</div>"
				+ "</div></div><div class=\"panel-body-m-r\"></div></div><div class=\"panel-body-b\">"
				+ "<div class=\"panel-body-b-l\"></div><div class=\"panel-body-b-c\"></div>"
				+ "<div class=\"panel-body-b-r\"></div></div></div>";

			if (typeof options.footer !== "undefined" && options.footer)
			{
				html += "<div class=\"panel-footer\"><div class=\"toolbars single\"><div class=\"toolbar\">"
					+ "<div class=\"toolbar-l\"></div><div class=\"toolbar-c\"><div class=\"toolbar-wrapper\">"
					+ "</div></div><div class=\"toolbar-r\"></div></div></div></div>";
			}

			html += "</div>";

			return html;

		},

		fetch: function ()
		{
			switch (arguments[0])
			{
				case "header":
					if (this.header !== null) return this.header;
					return this.header = (this.panel.children(".panel-header").find(".panel-header-text").length > 0) ? this.panel.children(".panel-header").find(".panel-header-text").eq(0) : null;
					break;
				case "toolbars":
					if (this.toolbars !== null) return this.toolbars;
					return this.toolbars = (this.panel.children(".panel-toolbars").find(".toolbar-wrapper").length > 0) ? this.panel.children(".panel-toolbars").find(".toolbar-wrapper") : null;
					break;
				case "body":
					if (this.body !== null) return this.body;
					return this.body = this.panel.children(".panel-body").find(".panel-body-wrapper > .scroll-wrapper, .panel-body-wrapper > .wrapper").eq(0);
					break;
				case "footer":
					if (this.footer !== null) return this.footer;
					return this.footer = (this.panel.children(".panel-footer").find(".wrapper").length > 0) ? this.panel.children(".panel-footer").find(".wrapper").eq(0) : null;
					break;
			}

		},

		add: function ()
		{
			switch (arguments[0])
			{
				case "header":
					if (this.header === null)
                    {
                        var headerText = checkExists(arguments[1]) ? arguments[1]: "";

						var panelHeader = $("<div class=\"panel-header\"><div class=\"panel-header-l\"></div>"
							+ "<div class=\"panel-header-c\"><div class=\"panel-header-wrapper\">"
                            + "<div class=\"panel-header-text\">" + headerText + "</div></div></div>"
                            + "<div class=\"panel-header-r\"></div></div>").prependTo(this.panel);

                        this.header = panelHeader.find(".panel-header-text").eq(0);

						this.panel.removeClass("without-header").addClass("with-header");

					} else
					{
						this.fetch("header").text(arguments[1]);
					}
					break;
				case "toolbar":
					if (this.panel.children(".panel-toolbars").length === 0)
					{
						$("<div class=\"panel-toolbars\"><div class=\"toolbars\"></div></div>").insertBefore(this.panel.children(".panel-body").eq(0));
					}
					this.panel.children(".panel-toolbars").children(".toolbars").append("<div class=\"toolbar\"><div class=\"toolbar-wrapper\"></div></div>");

					this.toolbars = this.panel.children(".panel-toolbars").find(".toolbar-wrapper");

					switch (this.toolbars.length)
					{
						case 1:
							this.panel.addClass("with-toolbar").removeClass("without-toolbar").removeClass("with-double-toolbar").removeClass("with-triple-toolbar");
							this.panel.children(".panel-toolbars").children(".toolbars").addClass("single").removeClass("double").removeClass("triple");
							break;
						case 2:
							this.panel.addClass("with-double-toolbar").removeClass("without-toolbar").removeClass("with-toolbar").removeClass("with-triple-toolbar");
							this.panel.children(".panel-toolbars").children(".toolbars").addClass("double").removeClass("single").removeClass("triple");
							break;
						case 3:
							this.panel.addClass("with-triple-toolbar").removeClass("without-toolbar").removeClass("with-double-toolbar").removeClass("with-toolbar");
							this.panel.children(".panel-toolbars").children(".toolbars").addClass("triple").removeClass("double").removeClass("single");
							break;
					}
					break;
				case "footer":
					if (this.footer === null)
					{
						this.footer = $("<div class=\"panel-footer\"><div class=\"toolbars single\"><div class=\"toolbar\">"
							+ "<div class=\"toolbar-wrapper\"></div></div></div></div>").appendTo(this.panel).find(".toolbar-wrapper").eq(0);
						this.panel.removeClass("without-footer").addClass("with-footer");
					}
					break;
			}
		},

		remove: function ()
		{
			switch (arguments[0])
			{
				case "header":
					if (this.header !== null) this.header.remove();
					this.header = null;
					this.panel.removeClass("with-header").addClass("without-header");
					break;
				case "footer":
					if (this.footer !== null) this.footer.remove();
					this.footer = null;
					this.panel.removeClass("with-footer").addClass("without-footer");
					break;
				case "toolbars":
					if (this.toolbars !== null && this.toolbars.length > 0)
					{
						this.panel.children(".panel-toolbars").remove();
					}
					this.toolbars = null;
					this.panel.removeClass("with-toolbar").removeClass("with-double-toolbar").removeClass("with-triple-toolbar").addClass("without-toolbar");
					break;
			}
		},

		SetTabPanelProperty: function (element, value, controlXML, property)
		{
			controlXML = parseXML(controlXML);

			var controlID = controlXML.selectSingleNode("Controls/Control").getAttribute("ID");

			var tabIndex = $("#" + controlID).find(".collapse-vertical, .collapse-horizontal");
			var tab = $("#" + controlID).children("a");

			switch (property.toLowerCase())
			{
				case "title":
					tab.find(".tab-text").text(value !== "" ? value : Resources.FormDesigner.TabTitleDescription);
					break;
				case "isenabled":
					tab.toggleClass("disabled", value === "false");
					break;
				case "isvisible":
					tab.toggleClass("invisible", value === "false");
					break;
				case "tabindex":
					tabIndex[0].setAttribute("tabindex", value);
					break;
			}
		}
	};

	if (typeof SCPanel === "undefined") SCPanel = SourceCode.Forms.Controls.Panel;

	$.widget("ui.panel", SourceCode.Forms.Controls.Panel);

	$.extend($.ui.panel.prototype, {
		getter: "fetch",
		options: {
			scrolling: false,
			toolbars: 0,
			footer: false,
			fullsize: false
		}
	});

})(jQuery);
