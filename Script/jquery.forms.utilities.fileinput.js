(function ($)
{
	$.fn.file = function ()
	{

		this.each(function ()
		{

			var btn = $(this), pos = btn.offset();
			var input = $("<input type=\"file\" multiple />").appendTo(btn).css({
				"position": "absolute",
				"-moz-opacity": "0",
				"filter": "alpha(opacity= 0)",
				"opacity": "0",
				"z-index": "2"
			});

			btn.on("mouseover.fileinput", function (e)
			{
				pos = btn.offset();
				input.css({
					"top": pos.top,
					"left": pos.left
				});

				if (SourceCode.Forms.Browser.msie)
				{
					input.css({
						"top": 0,
						"left": 0,
						"width": btn.width(),
						"height": btn.height()
					});
				}
			}).on("mouseout.fileinput", function (e)
			{
				input.css({
					"top": pos.top,
					"left": pos.left
				});
			}).on("mousemove.fileinput", function (e)
			{
				input.css({
					"left": (e.pageX - pos.left) - (input.width() / 1.2),
					"top": (e.pageY - pos.top) - (input.height() / 2)
				});
			});

			input.on("change.fileinput", function (e)
			{
				btn.trigger("choose", [e, input.val().replace("C:\\fakepath\\", "")])
			});

		});

		return this;
	}

	$.fn.choose = function (f)
	{
		$(this).on('choose', f);
	}

})(jQuery);
