(function ($)
{
    if (typeof SourceCode === 'undefined' || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === 'undefined' || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === 'undefined' || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};
    if (typeof SourceCode.Forms.Controls.View === 'undefined' || SourceCode.Forms.Controls.View === null) SourceCode.Forms.Controls.View = {};

    var SFCView;
    //no need to extend the base functionality at present
    SourceCode.Forms.Controls.View = SFCView =
        {
            //design time functions

            displayProperty: function ()
            {
                return false;
            },

            /**
            *	A User Interface to property XML resolver
            *	@param {object} context an reference object containing context of what the current values are and the direction of resolution. The same object is adjusted for the result
            *		-	property: The property's name
            *		-	value: The current property value
            *		-	display: The current property display
            *		-	icon: The current property icon
            *		-	resolveDirection: TO-PROPERTY-UI reflects that we are updating the UI. TO-PROPERTY-XML that we are updating the property xml that gets saved
             */
            designerPropertyResolver: function (context)
            {
                if (context.resolveDirection === "TO-PROPERTY-UI")
                {
                    if (context.value === "OVERLAYBUSY")
                    {
                        context.value = "true";
                    }
                    else
                    {
                        context.value = "false";
                    }
                }
                else
                {
                    if (context.value === "true")
                    {
                        context.value = "OVERLAYBUSY";
                    }
                    else
                    {
                        context.value = "NONE";
                    }
                }
            },

            setStyles: function (wrapper, styles)
            {
                //do nothing atm
            },

            setViewInstanceStyles: function (wrapper, styles)
            {
                if (styles && styles.xml)
                {
                    wrapper.find("div>").text("View");

                    var container = wrapper.children("div");
                    var options =
                        {
                            "padding": container
                        };
                    StyleHelper.setStyles(options, styles);
                }
            }
        };
})(jQuery);
