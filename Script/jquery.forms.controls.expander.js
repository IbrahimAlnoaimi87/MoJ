(function ($)
{

	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

	SourceCode.Forms.Controls.Expander =
	{
		_create: function ()
		{
			$("#NavigationPanel").on("navigationpanelexpand", this.ResizePanes.bind(this));
			$("#AuthenticatedPaneContainer").on("panecontainerresize", this.ResizePanes.bind(this));

			var hyperLink = this.element.find("[id*=expanderLink]");

			if ($chk(hyperLink) && !$chk(hyperLink.data("onclick_attached")))
			{
				hyperLink.data("onclick_attached");
				hyperLink.on("click", this._toggleExpansion.bind(this));
			}
		},

		ResizePanes: function ()
		{
			var containerPanel = jQuery("#Panel2");
			if ($chk(containerPanel))
			{
				var leftPanel = this.element.find("[id*=LeftPanel]");
				var rightPanel = this.element.find("[id$='RightPanel']");

				var containerWidth = containerPanel.width();
				if (containerWidth > 485)
				{
					var rightPercentage = (485 / containerWidth) * 100;
					rightPanel.css("width", rightPercentage + "%");

					leftPanel.css("width", (100 - rightPercentage) + "%");
				}
			}
		},

		_toggleExpansion: function (args)
		{
			var leftPanel = this.element.find(".expander-left-panel");
			var rightPanel = this.element.find(".expander-right-panel");

			var rightPanelContent = rightPanel.find(".expander-right-panel-content");
			var descriptionPanel = leftPanel.find(".expander-description-panel");

			var link = this.element.find(".dropbutton");

			if ($chk(leftPanel) && $chk(rightPanel))
			{
				if (this.element.hasClass("collapsed"))
				{
					this.element.removeClass("collapsed");

					link.addClass("active");
				}
				else
				{
					this.element.addClass("collapsed");

					link.removeClass("active");
				}
			}
		},
	}

	$.widget("ui.expander", SourceCode.Forms.Controls.Expander);

	$(function ()
	{
		$(".expander-control").expander();
	});


})(jQuery);

