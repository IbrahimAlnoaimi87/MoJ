(function ($)
{
	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

	SourceCode.Forms.Controls.CustomDropDown =
	$.extend({}, SourceCode.Forms.Controls.DropDown,
	{
		//#region
		_loadOptions: function ()
		{
			//#region
			var opts = this.element.find("option");
			var optsi = this.element.get(0).selectedIndex;

			for (var i = 0, l = opts.length; i < l; i++)
			{
				var currentOption = opts.eq(i);
				var selected = (currentOption.selected === true || optsi === i) ? true : false;
				var disabled = (currentOption.disabled === true) ? true : false;
				var option =
				{
					index: i,
					text: currentOption.text(),
					value: currentOption.val(),
					className: currentOption[0].className,
					selected: selected,
					disabled: disabled,
					title: currentOption.attr("title")
				}
				this._addOptionToDropdown(option);
			}
			//#endregion

		},

		_addOptionToDropdown: function (o)
		{
			//#region
			var customHtml = this.element.siblings().filter(this.element.attr("content")).find(o.text).html();
			if (customHtml === null)
				customHtml = o.text;

			var opt = $("<li title=\"" + title + "\" data-index=\"" + o.index + "\" class=\" " + (o.selected ? " selected" : "") + "\"><a href=\"javascript:;\" class=\"" + o.className + (o.disabled ? " disabled" : "") + "\"><span>" + customHtml + "</span>></a></li>");
			opt.appendTo(this.menu)
			var title = (o.title) ? o.title : o.text;
			opt[0].setAttribute("title", title);
			opt.find("span").html(customHtml);
			if (o.selected) this.selected = opt;
			//#endregion

		},
		_refreshValue: function ()
		{
			//#region
			if (this.control.find("input-control-t").length > 0)
				this.control.find("input-control-t")[0].style.display = "none";
			var customHtml = this.element.siblings().filter(this.element.attr("content")).find(this.element.find(":selected").text()).html();
			var inputControl = this.control.find("a.input-control");
			inputControl[0].style.overflow = "hidden";
			inputControl.children().remove();
			inputControl.append(customHtml);
			//#endregion
		},
		_setTextboxContent: function ()
		{
			var inputControl = this.control.find("a.input-control");
			var customHtml = $(this.menu.find(".selected").find("span")[0]).html(); // we put the custom html into the first span.
			inputControl.children().remove();
			inputControl.append(customHtml);
		},
		_findItemBySearchString: function ()
		{
			// just prevent the search part to be called by the custom dropdown.
		}

		//#endregion
	});

	$.widget("ui.customdropdown", SourceCode.Forms.Controls.CustomDropDown);

})(jQuery);
