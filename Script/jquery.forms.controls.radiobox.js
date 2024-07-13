(function ($)
{

	if (typeof SourceCode === "undefined" || SourceCode === null) { SourceCode = {}; }
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) { SourceCode.Forms = {}; }
	if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) { SourceCode.Forms.Controls = {}; }

	SourceCode.Forms.Controls.RadioBoxButton = {

		_create: function ()
		{

			if (this.element.is(":checked"))
			{
				this.element.closest("label.radiobox-button").addClass("checked");
			}
			else
			{
				this.element.closest("label.radiobox-button").removeClass("checked");
			}

			this.element.on("change", function (ev)
			{
				var $this = $(this);

				if ($this.is(":checked"))
				{
					if ($this.is("input[type=radio]"))
					{
						$(".radiobox-button.checked input[type=radio][name=" + $this.attr("name") + "]").each(function ()
						{
							if ($this[0] !== this) $(this).closest("label.radiobox-button").removeClass("checked");
						});
					}

					$(this).closest("label.radiobox-button").addClass("checked");
				}
				else
				{
					$(this).closest("label.radiobox-button").removeClass("checked");
				}
			});
		},

		disable: function ()
		{
			var element = this.element.find("label.radiobox-button.checked");
			element.addClass("disabled");
			$.Widget.prototype.disable.apply(this, arguments);
		},

		enable: function ()
		{
			var element = this.element.find("label.radiobox-button.checked");
			element.removeClass("disabled");
			$.Widget.prototype.enable.apply(this, arguments);
		},

		check: function ()
		{
			if (!this.element.is(":checked"))
			{
				this.element[0].checked = true;
                this.element.prop("checked", true);
				this.element.trigger("change");
			}
		},

		uncheck: function ()
		{
			if (this.element.is(":checked"))
			{
				this.element[0].checked = false;
                this.element.prop("checked", false);
				this.element.trigger("change");
			}
		},

		html: function (options)
		{
			var id;
			var guid = new String().generateGuid();
			var cssclass = "radiobox";

			if (checkExistsNotEmpty(options.id))
			{
				id = "radiobox-" + options.id;
			}
			else
			{
				id = "radiobox-" + guid;
			}

			if (checkExistsNotEmpty(options.collapsed) && (options.collapsed === true))
			{
				cssclass += " collapsed";
			}

			if (checkExistsNotEmpty(options.buttonssize) && (options.buttonssize === "small"))
			{
				cssclass += " small-buttons";
			}

			var html = " \
					<div class=\"section-expander\"></div> \
					<div class=\"section-specifier\"></div> \
					<div id=\"" + id + "\" class=\"" + cssclass + "\"> \
						<ul class=\"input-control-group\"> \
						</ul> \
					</div> \
					";

			return html;
		},

		add: function (options)
		{
			var labelclass = "radiobox-button";
			if (options.enabled !== "True")
			{
				labelclass = labelclass + " disabled";
			}
			if (options.extended === true)
			{
				labelclass = labelclass + " extended";
			}
			if (options.control === true)
			{
				labelclass = labelclass + " control";
			}
			if (options.ruleDisabled === true) {
				labelclass = labelclass + " disabled-rule";
			}

			var rulename = options.rule.htmlEncode();
			var ruledescription = options.description.htmlEncode();

			var html = "<li><label id=\"" + options.id + "\" class=\"" + labelclass + "\" for=\"FormEventViewExecute-" + options.id + "\">";
			html += "<input id=\"FormEventViewExecute-" + options.id + "\" type=\"radio\" name=\"" + options.name + "\" value=\"" + options.value + "\">";
			html += "<span class=\"radiobox-button-l\"></span>";
			html += "<span class=\"radiobox-button-c lyt-radiobox-content\">";
			html += "<span class=\"radiobox-button-icon " + options.icon + "\"></span>";
			html += "<span class=\"lyt-radiobox-text\">";
			html += "<span class=\"radiobox-button-text\" title=\"" + ruledescription + "\">";
			html += rulename;
			html += "</span>";
			html += "<span class=\"radiobox-button-desc\"></span>";
			html += "</span>";
			html += "</span>";
			html += "<span class=\"radiobox-button-r\"></span>";
			html += "</label></li>";

			$(html).appendTo(this.element).find("input[type=radio]").radioboxbutton();
		}

	};

	if (typeof SCRadioboxbutton === "undefined")
	{
		SCRadioboxbutton = SourceCode.Forms.Controls.RadioBoxButton;
	}

	$.widget("ui.radioboxbutton", SourceCode.Forms.Controls.RadioBoxButton);

	$(function ()
	{
		$(".radiobox-button input[type=radio]").radioboxbutton();
	});

})(jQuery);
