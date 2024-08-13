//Purpose: Common helper methods for all WYSIWYG widgets that overlay the form/view canvas (selectionloop etc)


(function ($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};

    SourceCode.Forms.CanvasWidgetHelper = {


        getAccurateLocation: function (selectedElement, commonParent)
        {
            return this._getAccurateLocation(selectedElement, commonParent);
        },

        _getAccurateLocation: function (selectedElement, scrollWrapper)
        {
            var scrollAmount = {
                top: scrollWrapper[0].scrollTop,
                left: scrollWrapper[0].scrollLeft
            };
            var selectedPosition = selectedElement.offset();
            var commonParentPosition = scrollWrapper.offset();

            return {
                left: (selectedPosition.left - commonParentPosition.left) + scrollAmount.left,
                top: (selectedPosition.top - commonParentPosition.top) + scrollAmount.top
            };
        },

    };
})(jQuery);
