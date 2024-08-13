(function ($)
{

    // Namespacing the Designer
    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};
    if (typeof SourceCode.Forms.Designers === "undefined" || SourceCode.Forms.Designers === null) SourceCode.Forms.Designers = {};

    var _checkOut = SourceCode.Forms.Designers.View.CheckOut = {
        _checkViewStatus: function (isOnFinish)
        {
            var retVal = false;

            if (_checkOut.View.IsViewEdit === true || _checkOut.View.IsViewEdit === "True" || _checkOut.View.IsViewEdit === "true")
            {
                if (_checkOut.View.ViewCheckedOutStatus === 1 && _checkOut.View.ViewCheckedOutBy.toLowerCase() === _checkOut.View.CurrentUser.toLowerCase())
                {
                    retVal = true;
                }
                else
                {
                    if (_checkOut.View.ViewCheckedOutStatus === 1 && _checkOut.View.ViewCheckedOutBy.toLowerCase() !== _checkOut.View.CurrentUser.toLowerCase())
                    {
                        // dont ask questions, try and check out the view and throw the error
                        modalizer.hide();
                        _checkOut.View.wizard.removeOverlay(); // SourceCode.Forms.Interfaces.Forms.panes.content.removeOverlay();
                        popupManager.closeLast();
                        popupManager.showError(Resources.ViewDesigner.ErrorViewAlreadyCheckedOutOtherUser);

                        retVal = false;
                    }
                    else if (_checkOut.View.ViewCheckedOutStatus === 0)
                    {
                        var ViewName = _checkOut.ViewDesigner._GetViewName();
                        var ViewID = _checkOut.ViewDesigner._GetViewID();
                        var exists = _checkOut.AJAXCall._checkViewNameExists(ViewName);
                        //popup and try to checkout the view if user confirms//
                        if (exists === false)
                        {
                            _checkOut._userCheckOutPrompt(isOnFinish);
                            retVal = false;
                        }
                        else
                        {
                            retVal = true;
                        }
                    }
                }
            }
            else
            {
                retVal = true;
            }

            return retVal;
        },

        _userCheckOutPrompt: function (isOnFinish)
        {
            var options = ({
                message: Resources.ViewDesigner.CheckOutPrompt,
                onAccept: _checkOut._checkOutCurrentView
            });

            if (isOnFinish === true)
            {
                options.onDecline = function ()
                {
                    popupManager.closeLast();
                    jQuery("#ViewWizard").wizard("finishCancel");
                }

                options.onAccept = function ()
                {
                    jQuery("#ViewWizard").removeOverlay();
                    _checkOut._checkOutCurrentView(true);
                }
            }

            popupManager.showConfirmation(options);
        },

        _checkOutCurrentView: function (isOnFinish)
        {
            var ViewId = _checkOut.ViewDesigner._GetViewID();
            var tryCheckOut = _checkOut.AJAXCall._checkOutView(ViewId);

            //If _checkOutView result in an exception error, it was handled by showing a popup message there, thus it is not necessary to handle the exception here
            if (!SourceCode.Forms.ExceptionHandler.isException(tryCheckOut))
            {
                popupManager.closeLast();

                if (isOnFinish === true)
                {
                    _checkOut.View.wizard.wizard('finish');

                    //No need to hide the modalizer here because after the popup close animation is finished, it will move or hide the modalzier
                    //If the modalizer is moved edited here, it will stop the transition animation for the modalizer
                }
            }
        }
    }
})(jQuery);
