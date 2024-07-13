//Purpose: An interactable grid widget used to select the image position property for the background tab of the format builder
//Author: Christopher Singh
(function ($)
{

	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
	if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

    SourceCode.Forms.ImagePositionWidget =
    {
        selectedImagePosition: null,

        itemTemplate: "<li><a class='image-position-block'></a></li>",

        positions: ["top-left", "top-center", "top-right", "center-left", "center-center", "center-right", "bottom-left", "bottom-center", "bottom-right"],


        _create: function (options)
        {
            this.options = $.extend({}, this.options, options);
            this.render();
        },

        render: function ()
        {
            this.element.addClass("image-position-widget");

            //render each position block with a click event
            for (var i = 0; i < this.positions.length; i++)
            {
                var dataItem = this.positions[i];
                var uiItem = $(this.itemTemplate);
                var aTag = uiItem.find("a");

                aTag.addClass(dataItem);

                var fn = (function (_dataItem)
                {
                    return function ()
                    {
                        this.selectedValue(_dataItem);
                    };

                })(dataItem);

                aTag.on("click.imagePositionWidget", fn.bind(this));

                this.element.append(uiItem);
            }

            //disable widget by default
            this.element.addClass("disabled");

            //set default-value
            this.selectedValue("top-center");
        },

        getElement: function ()
        {
            return this.element;
        },

        //This function is used to set and get the selected image position for the current widget.
        //The selected position is only updated if the position argument is valid.
        //@param    position
        //@returns  selectedImagePosition
        selectedValue: function (position)
        {
            if (checkExists(position) && this.positions.indexOf(position)>-1)
            {
                this.element.find(".selected").removeClass("selected");
                this.element.find("." + position).toggleClass('selected');
                this.selectedImagePosition = position;
            }
            return this.selectedImagePosition;
        },

        enable: function ()
        {
            this.element.removeClass("disabled");
        },

        _ensureRendered: function ()
        {
            if (!this._isRendered())
            {
                this._render();
            }
        },

        _isRendered: function ()
        {
            return (checkExists(this.element) && this.element.length > 0);
        }
    };

    $.widget("ui.imagePositionWidget", SourceCode.Forms.ImagePositionWidget);
    $.extend($.ui.imagePositionWidget.prototype,
    {
        options:
        {
        }
    });
})(jQuery);
