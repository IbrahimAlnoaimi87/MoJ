(function ($)
{
	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

	SourceCode.Forms.Controls.DynamicStyleDropDown =
	$.extend({}, SourceCode.Forms.Controls.DropDown,
	{
		_loadOptions: function ()
		{
			SourceCode.Forms.Controls.DropDown._loadOptions.apply(this, arguments);
			var items = this.menu.find("li a.has-style-metadata");

			for (var i = 0, l = items.length; i < l; i++)
			{
				this._applyInlineStyles(items.eq(i));
			}
		},
		_refreshValue: function ()
		{
			if (this.control.is(".has-style-metadata"))
			{
				this.control.data("metadata", null);
			}
			SourceCode.Forms.Controls.DropDown._refreshValue.apply(this, arguments);
			this._applyInlineStyles(this.control);
		},
		_applyInlineStyles: function (element)
		{
			if (element.is(".has-style-metadata"))
			{
				var m = element.metadata();
				if (checkExists(m))
				{
					for (var prop in m)
					{
						if (m.hasOwnProperty(prop))
							element[0].style[prop] = m[prop];
					}
				}
			}
		},
		_setTextboxContent: function (selectedValue, icon)
		{
			SourceCode.Forms.Controls.DropDown._setTextboxContent.apply(this, arguments);

			if (this.control.is(".has-style-metadata"))
			{
				this.control.data("metadata", null);
			}
			this._applyInlineStyles(this.control);
		}
		
	});

	if (typeof SCDynamicStyleDropDown === "undefined") SCDynamicStyleDropDown = SourceCode.Forms.Controls.DynamicStyleDropDown;

	$.widget("ui.dynamicstyledropdown", SourceCode.Forms.Controls.DynamicStyleDropDown);

})(jQuery);
