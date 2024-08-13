(function ($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Controls === "undefined" || SourceCode.Forms.Controls === null) SourceCode.Forms.Controls = {};

    SourceCode.Forms.DesignRenderHelper = function (options)
    {
        this._create(options);
    }

    var designRenderHelperPrototype =
        {
            _create: function (options)
            {
                if (options.modalizeControl)
                    this.modalizeControl = options.modalizeControl;
                if (options.controlToPopulate)
                    this.controlToPopulate = options.controlToPopulate;
                if (options.viewControl)
                    this.viewControl = options.viewControl;
                if (options.postUpdateFunction)
                    this.postUpdateFunction = options.postUpdateFunction;
                if (options.cultureHelper)
                    this.cultureHelper = options.cultureHelper;
                if (options.overRideControlText)
                    this.overRideControlText = options.overRideControlText;
            },
            renderControl: function (styleXml)
            {
                if (this.modalizeControl && this.modalizeControl.is(":visible"))
                {
                    this.modalizeControl.showBusyModal(true);
                }
                var newStyleXml = null;
                if (styleXml)
                    newStyleXml = styleXml.cloneNode(true);
                this.getControlValueAndStyleXml(newStyleXml);
                if (this.styleXml)
                {
                    //if the control has a local method to apply styling then use it otherwise make an ajax call
                    if (this.viewControl.setStyle)
                    {
                        this.controlToPopulate.empty();

                        var controlHtml = this.getDefaultControlDefinitionHtml(this.viewControl);
                        this.controlToPopulate.html(controlHtml);

                        SourceCode.Forms.Designers.Common.ensureControlOverlay(this.controlToPopulate);
                        var functionToCall = eval(this.viewControl.setStyle);
                        functionToCall(this.controlToPopulate, this.styleXml, { isStyleBuilder: true });
                        this.renderControlSuccess();
                    }
                    else
                    {
                        jQuery.ajax({
                            data: {
                                method: 'renderControl',
                                controlType: this.viewControl.controltype,
                                styleXml: (this.styleXml) ? this.styleXml.xml : "",
                                controlFullName: this.viewControl.fullName
                            },
                            url: "Utilities/AJAXCall.ashx",
                            type: "POST",
                            async: true,
                            success: this.renderControlSuccess.bind(this),
                            error: function () { this.renderControlFailure }.bind(this),
                            dataType: "text",
                            global: false
                        })
                    }
                }
                //if the control had no styles render its html
                else
                {
                    this.renderControlSuccess(this.viewControl.control.html());
                }
            },

            getDefaultControlDefinitionHtml: function (viewControl)
            {
                var html = viewControl.controlDefinitionHtml;

                if (viewControl.controltype !== "Table")
                {
                    return html;
                }

                var jqTable = viewControl.control.find('.editor-table').first();
                var isGrid = SourceCode.Forms.TableHelper.isRenderedAsGrid(jqTable);

                if (isGrid)
                {
                    var jqGrid = SourceCode.Forms.TableHelper.generateGrid(2, 2);

                    html = jqGrid[0].outerHTML;
                }

                return html;
            },

            getControlValueAndStyleXml: function (styleXml)
            {
                var value = "";
                if (this.viewControl.setText)
                {
                    //get formatted value
                    var value = (this.overRideControlText) ? "" : this.viewControl.controlText;
                    var formatNode;
                    var type = "";

                    if (styleXml)
                    {
                        formatNode = styleXml.selectSingleNode("Style/Format");
                        if (formatNode)
                        {
                            //if there are styles and there is a format resolve the format
                            //get the sample text if the text is blank
                            if (value === null || value === "")
                            {
                                var formatObject = this.cultureHelper.getFormatObject(formatNode.xml);
                                type = formatObject.type;
                                value = this.cultureHelper.getSampleValue(type, formatObject.pattern);
                            }
                            value = this.cultureHelper.applyFormatToValueAndStyleXml(formatNode.xml, styleXml, value);
                        }
                    }

                    //get the sample text if the text is still blank
                    if (value === null || value === "")
                    {
                        value = this.cultureHelper.getSampleValue(type);
                    }
                }
                this.styleXml = styleXml;
                this.valueToSetOnControl = value;
            },
            renderControlSuccess: function (data, textStatus)
            {
                if (this.modalizeControl.is(":visible"))
                {
                    this.modalizeControl.showBusyModal(false);
                }
                if (data)
                {
                    if (SourceCode.Forms.ExceptionHandler.isException(data))
                    {
                        SourceCode.Forms.ExceptionHandler.handleException(data);
                        return false;
                    }
                    else
                    {
                        this.controlToPopulate.empty();
                        this.controlToPopulate.html(data);
                        SourceCode.Forms.Designers.Common.ensureControlOverlay(this.controlToPopulate);
                    }
                }
                if (this.viewControl.setText && this.valueToSetOnControl)
                {
                    //fire the control's SetText method
                    var functionToCall = eval(this.viewControl.setText)
                    functionToCall(this.controlToPopulate, this.valueToSetOnControl);
                }

                if (this.postUpdateFunction)
                    this.postUpdateFunction();
            }
        }

    SCDesignRenderHelper = SourceCode.Forms.DesignRenderHelper;
    jQuery.extend(SCDesignRenderHelper.prototype, designRenderHelperPrototype);

})(jQuery);
