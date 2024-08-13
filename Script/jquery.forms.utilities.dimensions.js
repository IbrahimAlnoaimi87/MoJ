(function($) {

	$.fn.widthAll = function (arg)
	{
		var result = 0;
		if (arg !== undefined && arg !== null)
		{
			this.each(function () { $(this).width(arg); });
			result = this;
		}
		else
		{
			this.each(function () { result += $(this).width(); });
		}
		return result;
	};

	$.fn.heightAll = function (arg)
	{
		var result = 0;
		if (arg !== null && arg !== null)
		{
			this.each(function () { $(this).height(arg); });
			result = this;
		}
		else
		{
			this.each(function () { result += $(this).height(); });
		}
		return result;
	};

	$.fn.outerWidthAll = function (arg)
	{
		var result = 0;
		if (arg === undefined) arg = false;
		this.each(function () { result += $(this).outerWidth(arg); });
		return result;
	};

	$.fn.outerHeightAll = function (arg)
	{
		var result = 0;
		if (arg === undefined) arg = false;
		this.each(function () { result += $(this).outerHeight(arg); });
		return result;
    };

    $.fn.accurateHeight = function ()
    {
        return this[0].getBoundingClientRect().height;
    };
	 
})(jQuery);
