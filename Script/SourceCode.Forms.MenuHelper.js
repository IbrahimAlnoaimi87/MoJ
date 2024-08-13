if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};

SourceCode.Forms.MenuHelper =
{
    getTopOfForm: function (containerTopScroll)
    {
        var ipadTopOfForm = 0;

        if (SourceCode.Forms.Browser.safarimobile || SourceCode.Forms.Browser.ipad)
        {
            ipadTopOfForm = $('form')[0].getBoundingClientRect().top;
            //Only adjust for Forms
            if ($('div.runtime-form.theme-entry').length > 0)
            {
                //On a page the page margin must be taken into account
                var pageMargin = parseInt($('div.runtime-content').css('margin-top'));
                if (!isNaN(pageMargin))
                {
                    ipadTopOfForm -= pageMargin;
                }
            }

            if (SourceCode.Forms.Browser.ipad)
            {
                ipadTopOfForm = containerTopScroll + ipadTopOfForm;
            }
        }

        //TODO: remove this to only work with .runtime-form .form when the rename shelve has been applied
        var parent = !!jQuery('.runtime-page .page') ? jQuery('.runtime-page .page') : jQuery('.runtime-form .form');
        //On a page the page padding must be taken into account
        var adjustForPadding = parseInt(jQuery(parent).css("padding-top"));
        if (isNaN(adjustForPadding))
            adjustForPadding = 0;
        if (!!document.parentWindow === true) // In IE8 the padding is not applied so dont use
            adjustForPadding = 0;

        return (ipadTopOfForm - adjustForPadding);
    },

    getTopValue: function (options)
    {
        var element = options.element;

        var popupContentHeight = 0;
        if (typeof options.popupContentHeight !== "undefined")
            popupContentHeight = options.popupContentHeight;
        else if (typeof options.popupContent !== "undefined")
            popupContentHeight = options.popupContent.outerHeight();

        //default to always first try render at the bottom
        var locationVertical = (typeof options.locationVertical !== "undefined") ? options.locationVertical : "bottom";
        var topClass = (typeof options.topClass !== "undefined") ? options.topClass : "";
        var bottomClass = (typeof options.bottomClass !== "undefined") ? options.bottomClass : "";
        var middleClass = (typeof options.middleClass !== "undefined") ? options.middleClass : "";

        var containerTopScroll = jQuery(document.body).scrollParent().scrollTop();
        var ipadTopOfForm = this.getTopOfForm(containerTopScroll);

        var viewport = jQuery(!!document.defaultView ? document.defaultView : document.parentWindow);
        var viewportHeight = viewport.height();

        var elementTop = element.offset().top;
        var elementHeight = element.outerHeight();

        var spaceBelowElement = viewportHeight + containerTopScroll - elementTop - elementHeight;
        var spaceAboveElement = elementTop - containerTopScroll;

        var resultingLocation = "";
        switch (locationVertical)
        {
            case "top":
                if (popupContentHeight < spaceAboveElement)
                    resultingLocation = "top";
                else
                    resultingLocation = "bottom";
                break;
            case "bottom":
                if (popupContentHeight < spaceBelowElement || popupContentHeight > spaceAboveElement)
                    resultingLocation = "bottom";
                else
                    resultingLocation = "top";
                break;
            case "middle":
                resultingLocation = "middle";
                break;
        }
        if (typeof options.popupContent !== "undefined")
        {
            options.popupContent.removeClass(topClass);
            options.popupContent.removeClass(bottomClass);
            options.popupContent.removeClass(middleClass);
        }
        var result = 0;
        switch (resultingLocation)
        {
            case "top":
                if (typeof options.popupContent !== "undefined")
                    options.popupContent.addClass(topClass);
                result = (elementTop - popupContentHeight - ipadTopOfForm);
                break;
            case "bottom":
                if (typeof options.popupContent !== "undefined")
                    options.popupContent.addClass(bottomClass);
                result = (elementTop + elementHeight - ipadTopOfForm);
                break;
            case "middle":
                if (typeof options.popupContent !== "undefined")
                    options.popupContent.addClass(middleClass);
                result = (elementTop + elementHeight / 2 - popupContentHeight / 2);
                break;
        }
        return result;
    },

    getPointerPosition: function (options)
    {
        var element = options.element;

        var popupContentWidth = 0;
        if (typeof options.popupContentWidth !== "undefined")
            popupContentWidth = options.popupContentWidth
        else if (typeof options.popupContent !== "undefined")
            popupContentWidth = options.popupContent.outerWidth();

        var containerLeftScroll = jQuery(document.body).scrollParent().scrollLeft();
        var viewportWidth = jQuery(!!document.defaultView ? document.defaultView : document.parentWindow).width();

        var elementLeft = element.offset().left;
        var elementWidth = element.outerWidth();

        var spaceRightOfElement = viewportWidth + containerLeftScroll - elementLeft - elementWidth;
        var spaceLeftOfElement = elementLeft - containerLeftScroll;

        if ((spaceLeftOfElement < popupContentWidth / 2) || (spaceRightOfElement < popupContentWidth / 2))
        {
            var aspectRatio = ((elementWidth / 2) / popupContentWidth) * 100;
            return aspectRatio < 50 ? aspectRatio : 50;
        }
        else
        {
            return 50;
        }
    },

    getLeftValue: function (options)
    {
        var element = options.element;

        var popupContentWidth = 0;
        if (typeof options.popupContentWidth !== "undefined")
            popupContentWidth = options.popupContentWidth;
        else if (typeof options.popupContent !== "undefined")
            popupContentWidth = options.popupContent.outerWidth();

        //default to always first try render left
        var locationHorizontal = (typeof options.locationHorizontal !== "undefined") ? options.locationHorizontal : "left";
        var leftClass = (typeof options.leftClass !== "undefined") ? options.leftClass : "";
        var rightClass = (typeof options.rightClass !== "undefined") ? options.rightClass : "";
        var centerClass = (typeof options.centerClass !== "undefined") ? options.centerClass : "";

        var containerLeftScroll = jQuery(document.body).scrollParent().scrollLeft();
        var viewportWidth = jQuery(!!document.defaultView ? document.defaultView : document.parentWindow).width();

        var elementLeft = element.offset().left;
        var elementWidth = element.outerWidth();

        var spaceRightOfElement = viewportWidth + containerLeftScroll - elementLeft - elementWidth;
        var spaceLeftOfElement = elementLeft - containerLeftScroll;

        var resultingLocation = "";
        switch (locationHorizontal)
        {
            case "left":
                if (popupContentWidth < spaceLeftOfElement)
                    resultingLocation = "left";
                else
                    resultingLocation = "right";
                break;
            case "right":
                if (popupContentWidth < spaceRightOfElement || popupContentWidth > spaceLeftOfElement)
                    resultingLocation = "right";
                else
                    resultingLocation = "left";
                break;
            case "center":
                resultingLocation = "center";
                break;
        }
        if (typeof options.popupContent !== "undefined")
        {
            options.popupContent.removeClass(leftClass);
            options.popupContent.removeClass(rightClass);
            options.popupContent.removeClass(centerClass);
        }
        var result = 0;
        switch (resultingLocation)
        {
            case "left":
                if (typeof options.popupContent !== "undefined")
                    options.popupContent.addClass(leftClass);
                result = (elementLeft - popupContentWidth);
                break;
            case "right":
                if (typeof options.popupContent !== "undefined")
                    options.popupContent.addClass(rightClass);
                result = (elementLeft + elementWidth);
                break;
            case "center":
                if (typeof options.popupContent !== "undefined")
                    options.popupContent.addClass(centerClass);
                result = (elementLeft + elementWidth / 2 - popupContentWidth / 2);
                break;
        }
        return result;
    }
}