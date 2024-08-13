(function ($)
{

	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

	SourceCode.Forms.Controls.ServerTabBox = {
		_create: function ()
		{
			if (this.element.hasClass("tab-box"))
			{
				this.TabBox = this.element;
			}
			else
			{
				//TO DO generate HTML
			}
			this.Tabs = this.TabBox.children("ul").children("li").find("a.tab");
			this.wireEvents();
		},

		wireEvents: function ()
		{
			this.Tabs.on("click", this.TabClick.bind(this));
		},

		TabClick: function ()
		{
			var ev = (typeof arguments[0] !== "undefined" && arguments[0] !== null) ? arguments[0] : null;
			var clickedTab = jQuery(ev.target).closest(".tab");
			if (!clickedTab.is(".disabled"))
			{
				var currentSelectedTab = this.Tabs.filter(".selected");
				if (clickedTab[0] !== currentSelectedTab[0])
				{
					//Hide old tab
					var currentSelectedTabContent = jQuery("#" + currentSelectedTab[0].id + "_Content");
					currentSelectedTabContent.hide();
					currentSelectedTab.removeClass('selected');

					//Show new tab
					var currentTabContent = jQuery("#" + clickedTab[0].id + "_Content");
					currentTabContent.show();
					clickedTab.addClass('selected');

					var event = jQuery.Event();
					event.type = "tabselected";
					event.detail = { newTab: clickedTab, oldTab: currentSelectedTab };
					jQuery(this.TabBox).trigger(event);

				}
			}

			ev.preventDefault();
		}
	};

	if (typeof SCServerTabBox === "undefined") SCServerTabBox = SourceCode.Forms.Controls.ServerTabBox;

	$.widget("ui.ServerTabBox", SourceCode.Forms.Controls.ServerTabBox);

})(jQuery);


