(function ($)
{
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};

    SourceCode.Forms.ImagePicker =
    {
        initialize: function (callback)
        {
            var _this = this;
            _this.callback = callback;
            $.ajax(
                {
                    data:
                    {
                        method: 'getComplexPropertyConfiguration',
                        assemblyName: 'SourceCode.Forms.Controls.Web.PropertyConfigs.BackgroundImagePropertyConfig, SourceCode.Forms.Controls.Web',
                        initFunction: ''
                    },
                    type: 'POST',
                    url: 'Utilities/AJAXCall.ashx',
                    error: function (XMLHttpRequest, textStatus, errorThrown)
                    {
                        SourceCode.Forms.ExceptionHandler.handleException(errorThrown);
                    },
                    success: function (data, textStatus, xmlHttpRequest)
                    {
                        if (SourceCode.Forms.ExceptionHandler.handleException(data))
                        {
                            return;
                        }

                        var impagePickerHtml = data.documentElement.selectSingleNode('html');

                        $("<div class=\"complex-property-config-wrapper\"></div>").html(impagePickerHtml.text).appendTo("body");

                        var _html = "<iframe id=\"imagePropertyConfig_frame\" src=\"Runtime/View.aspx?_id=dbe03169-0eb4-403a-8081-f0fa2250fdeb&overFlowY=none";
                        _html += "\" frameborder=\"0\"></iframe>";

                        _this.showDialog(_html);
                    }
                });
        },

        showDialog: function (pickerHtml)
        {
            var _this = this;

            popupManager.showPopup(
                {
                    buttons: [
                        {
                            type: "help",
                            click: function ()
                            {
                                HelpHelper.runHelp(7029);
                            }
                        },
                        {
                            text: Resources.WizardButtons.OKButtonText,
                            click: function ()
                            {
                                _this.dialogOkClick.apply(_this);
                            }
                        },
                        {
                            id: 'imagePropertyConfig_cancelButton',
                            text: Resources.WizardButtons.CancelButtonText
                        }
                    ],
                    closeWith: 'imagePropertyConfig_cancelButton',
                    content: jQuery('#imagePropertyConfig_dialogPanel'),
                    headerText: jQuery('#imagePropertyConfig_dialogPanel').attr('selectImageTitle'),
                    height: 400,
                    width: 560,
                    removeContent: true
                }).showBusy();

            jQuery("#imagePropertyConfig_contentPanel").find(".scroll-wrapper").append(pickerHtml);
            jQuery("#imagePropertyConfig_frame").one('load', function ()
            {
                var lastPopup = popupManager.getLastOpenPopup();
                if (checkExists(lastPopup))
                {
                    lastPopup.showBusy(false);
                }

                var iframeElement = this,
                    imgPropContentWin = iframeElement.contentWindow || iframeElement.contentDocument.parentWindow;

                $(imgPropContentWin.document).ready(function ()
                {
                    var grid = $(imgPropContentWin.document).find(".grid");
                    var container = grid.parent();
                    container.height($(imgPropContentWin).height());
                    grid.addClass("full");
                });
            });
        },

        dialogOkClick: function () 
        {
            var iframeDoc = document.getElementById('imagePropertyConfig_frame').contentWindow.document;
            var imageSelectElem = iframeDoc.getElementById('00000000-0000-0000-0000-000000000000_2d148c7a-64be-5b9f-7e64-85baa70f6d0e');
            var imageNameElem = iframeDoc.getElementById('00000000-0000-0000-0000-000000000000_0d56bd30-2736-1197-9e99-d847236fa2e2');

            var imageId = $(imageSelectElem).text();
            var imageName = $(imageNameElem).text();

            if (checkExists(imageId) && checkExists(imageName)) 
            {
                this.callback(imageId, imageName);

                popupManager.closeLast({
                    cancelOnClose: true
                });
            }
            else
            {
                popupManager.showWarning(jQuery("#imagePropertyConfig_dialogPanel").attr('itemSelectedValidation'));
            }
        }
    };
})(jQuery);
