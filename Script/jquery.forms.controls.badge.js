(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Widget === "undefined" || SourceCode.Forms.Widget === null) SourceCode.Forms.Widget = {};

    SourceCode.Forms.Widget.Badge =
	{

	    _create: function ()
	    {
	    },

	    show: function(){
	        this.element.addClass("show");
	    }, 

	    hide: function ()
	    {
	        this.element.removeClass("show");
	    }
	};

    $.widget("ui.badge", SourceCode.Forms.Widget.Badge);
    $.extend($.ui.badge.prototype,
        {
            options:
            {
                
            }
        });
})(jQuery);