/*
Session Management
*/
(function ($)
{

    if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
    if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};

    SourceCode.Forms.SessionManagement =
    {
        // Private Properties
        _countdowntimer: null,
        _expiretimer: null,
        _keepalivetimer: null,
        _warntimer: null,
        _dialogtimerPlaceHolder: null,
        _dialogHeight: 450,
        _dialogWidth: 780,
        _isMobileApp: (navigator.userAgent.indexOf("Mobilies") >= 0),
        // Public Properties
        Session: {},

        // Private Functions
        _applyCountDownTimer: function ()
        {
            this._dialogtimerPlaceHolder = $("#SessionExpirationWarningDialog .countdown-timer");

            if (checkExists(this.Session.expiration))
            {
                var currentTime = (new Date()).getTime();
                var targetTime = this.Session.expiration.getTime();

                // While the target time has not yet been reached
                if (currentTime < targetTime && this._dialogtimerPlaceHolder.length > 0)
                {
                    // Calculating the time remaining
                    this._dialogtimerPlaceHolder.text(Math.floor((targetTime - currentTime) / 1000));

                    // Update the display again in a second
                    this._countdowntimer = window.setTimeout(this._applyCountDownTimer.bind(this), 1000);
                }
                else
                {
                    window.clearTimeout(this._countdowntimer);
                    this._countdowntimer = null;
                }
            }
        },

        _checkSessionRenewalDialog: function (dialog)
        {
            // A check is done every second to see if the dialog has been closed
            if (dialog.closed)
            {
                // Return focus
                window.focus();

                this._getSessionDetails();
            }
            else
            {
                window.setTimeout(this._checkSessionRenewalDialog.bind(this, dialog), 1000);
            }
        },

        _getClaimsSessionRenewalUrl: function ()
        {
            // Building the URL for the dialog, forcing to the login URL, but to return to the Session Renewal display
            var queryChar = (this.Session.loginurl.indexOf("?") > 0) ? "&" : "?";
            var renewalUrl = "{0}{1}_sessionUpdate=1&ReturnUrl={2}".format(this.Session.loginurl, queryChar, applicationRoot + "Session.aspx");
            return renewalUrl;
        },

        _claimSessionRenewal: function ()
        {
            // When a Claims-based session has expired and the update session has failed,
            // a dialog will be called to renew the session
            var _this = this;

            // window.open does not have a center option, mimicking it
            var left = Math.floor((screen.availWidth - this._dialogWidth) / 2), top = Math.floor((screen.availHeight - this._dialogHeight) / 2);

            // Opening a dialog
            var dialog = window.open(this._getClaimsSessionRenewalUrl(), "dlg", "height=" + this._dialogHeight + ",width=" + this._dialogWidth + ",status=no,toolbar=no,menubar=no,location=no,left=" + left + ",top=" + top);

            // If the popup is blocked, one will be redirected to sign in, current design session will be lost
            if (dialog !== undefined && dialog !== null)
            {
                if (this._expiretimer !== null)
                {
                    window.clearTimeout(this._expiretimer);
                    this._expiretimer = null;
                }

                $("body").overlay({ modal: true, icon: "loading" });

                // Remove focus from current window & place it on the dialog
                window.blur();
                dialog.focus();

                window.setTimeout(this._checkSessionRenewalDialog.bind(this, dialog), 0);
            }
        },

        _dialogClose: function (dialog)
        {
            if (dialog.id === "SessionExpiredDialog")
            {
                this._redirectToLoginPage();
            }
        },

        _dialogShow: function (dialog)
        {
            if (dialog.id === "SessionExpirationWarningDialog")
            {
                if (this.Session.keepalive)
                {
                    var keepaliveCB = $("#SessionExpirationWarningDialog input[type=checkbox]").checkbox();
                }
                window.focus();
            }
        },

        _extendSessionButtonClick: function ()
        {
            var keepaliveCB = $("#SessionExpirationWarningDialog input[type=checkbox]");
            var keepAlive = keepaliveCB.length > 0 && keepaliveCB.is(":checked");
            popupManager.closeLast();

            if (keepAlive)
            {
                this.keepalive();
            }
            else
            {
                if (this.Session.type == "forms")
                {
                    this.updatesession();
                }
                else
                {
                    this.renewclaimssession();
                }
            }

        },

        _loadSessionDetails: function ()
        {
            if (typeof (__runtimeSessionDetails) === "undefined")
            {
                this._getSessionDetails();
            }
            else
            {
                this._getSessionDetailsSuccess($xml(__runtimeSessionDetails));
            }
        },

        _getSessionDetails: function ()
        {
            $.ajax({
                cache: false,
                url: applicationRoot + "Utilities/AJAXCall.ashx",
                data: "method=GetSessionDetails",
                success: this._getSessionDetailsSuccess.bind(this)
            });
        },

        _getSessionDetailsSuccess: function (data)
        {
            // Avoid Forms Authentication redirect response handling
            if (typeof data.documentElement !== "undefined" && data.documentElement.tagName.toLowerCase() === "session")
            {
                $("body").removeOverlay();

                var obj = {};

                $.each(data.documentElement.attributes, function ()
                {
                    switch (this.name)
                    {
                        case "expiration":
                            obj[this.name] = Date.parse(this.value);
                            break;
                        case "keepalive":
                        case "slidingexpiration":
                            obj[this.name] = this.value.toLowerCase() === "true" ? true : false;
                            break;
                        case "timeout":
                        case "warntimeout":
                            obj[this.name] = parseInt(this.value, 10);
                            break;
                        case "loginurl":
                        case "userfqn":
                        case "userdisplayname":
                        case "useremail":
                        case "showlogout":
                            obj[this.name] = this.value;
                            break;
                        default:
                            obj[this.name] = this.value;
                    }

                });

                this.Session = obj;

                if (this.Session["expiration"] != null && this.Session.type !== "anonymous")
                {
                    var warntimeout = checkExists(this.Session.warntimeout) ? this.Session.warntimeout * 1000 : 30000;

                    var timerWindow = 0;

                    var popupoptions = {
                        headerText: Resources.CommonPhrases.SessionExpirationText,
                        type: "sign-in",
                        onClose: this._dialogClose.bind(this),
                        onShow: this._dialogShow.bind(this),
                        preserveContent: false,
                        cssClass: "auto-scale-height"// not simple-message-content
                    };

                    var warnpopup = $.extend({ id: "SessionExpirationWarningDialog" }, popupoptions);

                    if (checkExists(this.Session.expiration))
                    {
                        timerWindow = this.Session.expiration.getTime() - (new Date()).getTime();
                    }
                    else
                    {
                        timerWindow = (new Date()).getTime() + this.Session.timeout * 60 * 1000;
                    }

                    if (this.Session.slidingexpiration)
                    {
                        warnpopup.message = Resources.CommonPhrases.SessionExpirationWarningExtendableText;
                        warnpopup.buttons = [
                            {
                                text: Resources.CommonActions.ConfirmText,
                                click: this._extendSessionButtonClick.bind(this)
                            },
                            {
                                text: Resources.CommonActions.Close,
                                click: function ()
                                {
                                    popupManager.closeLast();
                                }
                            }
                        ];
                    }
                    else
                    {
                        warnpopup.message = Resources.CommonPhrases.SessionExpirationWarningNonExtendableText;
                    }

                    warnpopup.message = warnpopup.message.replace("{0}", "<span class=\"countdown-timer\" />");

                    //You cannot auto extend a claims session so only show the option for form auth
                    if (this.Session.keepalive && this.Session.slidingexpiration && this.Session.type === "forms")
                    {
                        warnpopup.message += "<div>{0}</div>".format(SCCheckbox.html(
                        {
                            id: "SessionKeepAliveCheckbox",
                            label: Resources.CommonPhrases.SessionKeepAliveText
                        }));
                    }

                    if (this._warntimer !== null)
                    {
                        window.clearTimeout(this._warntimer);
                        this._warntimer = null;
                    }

                    // Only apply a warning timer if the expiration is in deed in the future
                    if ((timerWindow - warntimeout) > 0)
                    {
                        this._warntimer = window.setTimeout(function ()
                        {
                            window.clearTimeout(this._warntimer);
                            this._warntimer = null;
                            popupManager.showMessage(warnpopup);
                            this._applyCountDownTimer();
                        }.bind(this), (timerWindow - warntimeout));
                    }

                    var expiredpopup = $.extend(
                    {
                        id: "SessionExpiredDialog",
                        message: Resources.CommonPhrases.SessionExpiredText,
                        cssClass: "auto-scale-height simple-message-content"
                    }, popupoptions);

                    this._expiredpopup = expiredpopup;

                    if (this._expiretimer !== null)
                    {
                        window.clearTimeout(this._expiretimer);
                        this._expiretimer = null;
                    }

                    // Only apply a notification timer if the expiration is in deed in the future
                    if (timerWindow > 0)
                    {
                        this._expiretimer = window.setTimeout(function ()
                        {
                            if ($("#SessionExpirationWarningDialog").length > 0)
                            {
                                popupManager.closeLast();
                            }

                            popupManager.showMessage(expiredpopup);
                            // Automatically close the dialog to invoke redirection to the login form
                            window.setTimeout(function ()
                            {
                                popupManager.closeLast();
                            }, 3000);

                        }, timerWindow);
                    }
                }
                var doc = document;
                var avatarCtrl = $(".avatar-control");
                if ($(".main-avatar", doc).length === 0)
                {
                    try
                    {
                        // The avatar may be on a parent page(such as host page). We have a try catch for any cross origin policy issue when it is in a iframe that is not related like SP
                        doc = parent.document;
                        avatarCtrl = parent.$(".avatar-control");
                    }
                    catch (e)
                    {
                    }
                }
                if (this.Session.type !== "anonymous" && $(".main-avatar", doc).length > 0)
                {
                    // Update the user details in the user avatar
                    $(".avatar-name", doc).attr("title", this.Session["userfqn"]).text(this.Session["userdisplayname"]);
                    $(".lyt-avatar-text .name", doc).text(this.Session["userdisplayname"]);
                    $(".lyt-avatar-text .email", doc).text(this.Session["useremail"]);
                    $(".avatar-popup #EmailLink", doc).attr("href", "mailto:?Subject=Nintex%20Designer&cc=" + this.Session["useremail"]);

                    if (this.Session["showlogout"] === "false" || (checkExists(avatarCtrl) && avatarCtrl.avatar("option", "showLogout").toString() === "false"))
                    {
                        $(".avatar-popup #LogoutLink", doc).hide();
                    }
                    else
                    {
                        $(".avatar-popup #LogoutLink", doc).show()
                    }
                }
            }
            else
            {
                // Session Details fetch failed, return to login
                this._redirectToLoginPage();
            }
        },

        _redirectToLoginPage: function ()
        {
            $(window).off("beforeunload");
            var queryChar = (this.Session.loginurl.indexOf("?") > 0) ? "&" : "?";
            var returnUrl = location.href.substring(location.href.toUpperCase().indexOf(applicationRoot.toUpperCase()));
            if (returnUrl.indexOf("?") > 0 || returnUrl.indexOf("&") > 0)
            {
                var queryStringVals = returnUrl.split(/\?|\&/);
                for (var p = 0; p < queryStringVals.length; p++)
                {
                    if (queryStringVals[p].toUpperCase().indexOf("_SPINT=0") === 0)
                    {
                        returnUrl = returnUrl.replace(queryStringVals[p], "_spmod=1");
                    }
                }
            }
            returnUrl = encodeURIComponent(returnUrl);
            document.location.href = "{0}{1}ReturnUrl={2}&_sessionUpdate=1".format(this.Session.loginurl, queryChar, returnUrl);
        },

        _updateSessionError: function (XMLHttpRequest, textStatus, responseText)
        {
            if (XMLHttpRequest.status === 403 && this.Session.type !== "forms")
            {
                this._redirectToLoginPage();
            }
        },

        _updateSessionSuccess: function (data)
        {
            if (typeof SourceCode.Forms.ExceptionHandler.isException === "function" && SourceCode.Forms.ExceptionHandler.isException(data))
            {
                SourceCode.Forms.ExceptionHandler.handleException(data);
                return;
            }
            this._getSessionDetails();
        },

        // Public Functions
        init: function ()
        {
            var runningRuntimeInDesigner = false;
            try
            {
                runningRuntimeInDesigner = window.self !== window.parent && window.parent.document.getElementById("AuthenticatedPaneContainer");
            }
            catch (e) { }

            var runningRuntimeInSubForm = false;
            try
            {
                if (__runtimeFormLevel)
                {
                    var formLevel = parseInt(__runtimeFormLevel, 10);
                    if (formLevel > 0)
                    {
                        runningRuntimeInSubForm = window.self !== window.parent && $(window.frameElement).is("iframe.runtime-popup");
                    }
                }
            }
            catch (e) { }

            // Only manage a session if not on a login screen
            if ($("#SignInWrapper").length == 0 && !runningRuntimeInDesigner && !runningRuntimeInSubForm)
            {
                $("body").on("click", ".sflogout-button", function ()
                {
                    $(window).off("beforeunload");
                    $("body").on("click", ".sflogout-button",  function (e)
                    {
                        // Disable the signout href's after the first time logout is clicked
                        e.preventDefault();
                    });
                });
                this._loadSessionDetails();
            }
        },

        keepalive: function ()
        {
            // Stopping the expiration notification
            if (this._expiretimer !== null)
            {
                window.clearTimeout(this._expiretimer);
                this._expiretimer = null;
            }

            var timerWindow = 0;

            if (checkExists(this.Session.expiration))
            {
                timerWindow = this.Session.expiration.getTime() - (new Date()).getTime();
            }
            else
            {
                timerWindow = (new Date()).getTime() + this.Session.timeout * 60 * 1000;
            }

            function extendSessionSuccess(data)
            {
                if (typeof data.documentElement !== "undefined" && data.documentElement.tagName.toLowerCase() === "success")
                {
                    this._keepalivetimer = window.setTimeout(extendSession, timerWindow);
                }
                else
                {
                    popupManager.showMessage(this._expiredpopup);
                    // Automatically close the dialog to invoke redirection to the login form
                    window.setTimeout(function ()
                    {
                        popupManager.closeLast();
                    }, 3000);
                }

            }

            var extendSession = function ()
            {
                $.ajax({
                    cache: false,
                    url: applicationRoot + "Utilities/AJAXCall.ashx",
                    data: "method=extendsession",
                    success: extendSessionSuccess.bind(this),
                    error: extendSessionSuccess.bind(this),
                });
            }.bind(this);
            extendSession();
        },

        renewclaimssession: function ()
        {
            if (this._warntimer !== null)
            {
                window.clearTimeout(this._warntimer);
                this._warntimer = null;
            }

            if (this._isMobileApp)
            {
                if (this._expiretimer !== null)
                {
                    window.clearTimeout(this._expiretimer);
                    this._expiretimer = null;
                }

                $("body").overlay({ modal: true, icon: "loading" });
                SourceCode.Forms.Runtime.MobileBridge.sendToMobileDevice({ methodName: "renewSession", url: window.location.origin + SourceCode.Forms.SessionManagement._getClaimsSessionRenewalUrl() + "?_mobileSession=1" })
                .done(function (message)
                {
                    // Continue execution
                    SourceCode.Forms.SessionManagement._getSessionDetails();
                });
            }
            else
            {
                // Do normal browser renew
                this._claimSessionRenewal();
            }
        },

        updatesession: function ()
        {
            if (this._warntimer !== null)
            {
                window.clearTimeout(this._warntimer);
                this._warntimer = null;
            }

            if (this._expiretimer !== null)
            {
                window.clearTimeout(this._expiretimer);
                this._expiretimer = null;
            }

            // making an ajax call that will extend the session through sliding expiration
            // upon success will trigger a renewal of session details
            $.ajax({
                cache: false,
                url: applicationRoot + "Utilities/AJAXCall.ashx",
                data: "method=extendsession",
                success: this._getSessionDetails.bind(this),
                error: this._updateSessionError.bind(this)
            });
        }
    };

    $(function ()
    {
        SourceCode.Forms.SessionManagement.init();
    });
})(jQuery);
