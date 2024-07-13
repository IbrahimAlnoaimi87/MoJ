if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};

SourceCode.Forms.ExceptionHandler = new function ()
{
    var SFE = this;

    this.AJAX_READYSTATE_REQUEST_NOT_INITIALIZED = 0;
    this.AJAX_READYSTATE_REQUEST_BEEN_SETUP = 1;
    this.AJAX_READYSTATE_REQUEST_BEEN_SENT = 2;
    this.AJAX_READYSTATE_REQUEST_IN_PROCESS = 3;
    this.AJAX_READYSTATE_REQUEST_COMPLETE = 4;

    //[Functions]
    //_formatText
    this._formatText = function (pText)
    {
        var text = "";
        if (checkExists(pText))
        {
            text = pText.htmlDecode();  //In case if the text contain xml encoded text like "&gt;", change it to ">" to avoid double encoding
            text = text.htmlEncodeWithExclusionList();
        }

        return text
            .replace(/\s+/g, ' ')
            .replace(/\.([a-z])/ig, ".<wbr/>$1")
            .replace(/ (at) ([a-zA-Z])/g, "<br/><br/><span style=\"font-weight: 700;\">$1</span> $2")
            .replace(/ (in) ([A-Z]:\\)/g, "<br/><span style=\"font-weight: 700;\">$1</span> $2")
            .replace(/<br\/>/, '');
    };

    //_writeDetail
    this._writeDetail = function (pXmlNode)
    {
        var _result = '';
        var _childNodes = pXmlNode.childNodes;

        for (var i = 0, _numberOfNodes = _childNodes.length; i < _numberOfNodes; i++)
        {
            var _childNode = _childNodes[i];
            var _nodeName = _childNode.nodeName;
            var _firstChild;
            var text = "";

            if ((_firstChild = _childNode.firstChild) !== null)
            {
                text = _childNode.getAttribute("Name");

                if (checkExists(text))
                {
                    text = text.htmlDecode();  //In case if the text contain xml encoded text like "&gt;", change it to ">" to avoid double encoding
                    text = text.htmlEncodeWithExclusionList();
                }

                _result += "<li>" + text;

                var _nodeValue = _firstChild.nodeValue;

                if (_firstChild.nodeType === 3)
                    _result += ": <pre>" + this._formatText(_nodeValue) + "</pre></li>";
                else
                    _result += "</li><ul>" + this._writeDetail(_childNode);
            }

            if (i === _numberOfNodes - 1)
                _result += "</ul>";
        }

        return _result;
    };

    this.getExceptionDetails = function (pExceptionData)
    {
        if (!this.isException(pExceptionData)) return null;

        var details = {};

        if (typeof pExceptionData === "string") //String object
            pExceptionData = parseXML(pExceptionData);

        var _xnException = pExceptionData.documentElement;
        var _xnMessage = _xnException.selectSingleNode("DisplayMessage");

        if (!checkExists(_xnMessage))
            _xnMessage = _xnException.selectSingleNode("Message");

        _xnException.removeChild(_xnMessage);

        var _isExtendedDetail = _xnException.getAttribute("ExtendedDetail") === "T";
        details.detail = "";
        details.message = "";
        details.title = "";
        var text = this._formatText(_xnMessage.text);

        details.message = String.properObjectName(text);

        if (_isExtendedDetail)
            details.detail = this._writeDetail(_xnException) + "</div>";

        var headerText = _xnException.getAttribute("Title");
        if (checkExists(headerText))
        {
            details.title = headerText.htmlDecode();  //In case if the text contain xml encoded text like "&gt;", change it to ">" to avoid double encoding
            details.title = details.title.htmlEncodeWithExclusionList();
        }

        return details;
    };

    this.getVanillaExceptionDetails = function (pExceptionData)
    {
        if (!this.isException(pExceptionData)) return null;

        var details =
        {
            stack: "",
            message: "",
            title: ""
        }; 

        if (typeof pExceptionData === "string") //String object
        {
            pExceptionData = parseXML(pExceptionData);
        }

        var xnException = pExceptionData.documentElement;
        var xnMessage = xnException.selectSingleNode("DisplayMessage");

        if (!checkExists(xnMessage))
            xnMessage = xnException.selectSingleNode("Message");

        if (checkExists(xnMessage))
            details.message = xnMessage.text;

        var _isExtendedDetail = xnException.getAttribute("ExtendedDetail") === "T";

        if (_isExtendedDetail)
        {
            var xnStack = xnException.selectSingleNode("StackTrace");
            if (checkExists(xnStack))
            {
                details.stack = xnStack.text;
            }
        }
          
        var headerText = xnException.getAttribute("Title");
        if (checkExists(headerText))
        {
            details.title = headerText;
        }

        return details;
    };

    this.redirectPost = function (url, data)
    {
        var form = document.createElement('form');
        document.body.appendChild(form);
        form.method = 'post';
        form.action = url;
        for (var name in data)
        {
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = data[name];
            form.appendChild(input);
        }
        form.submit();
    };

    //TODO: Localize!
    //handleException
    // TODO: 0028
    this.handleException = function (pExceptionData, pOnClose)
    {
        var exceptionDetails = this.getExceptionDetails(pExceptionData);
        if (exceptionDetails == null) return false;


        var calculatedWidth = Math.floor(jQuery(window).width() / 10 * 9);
        if (calculatedWidth > 640)
        {
            calculatedWidth = 640;
        }

        masterPopupManager.showExtendedMessage({
            headerText: exceptionDetails.title,
            message: exceptionDetails.message,
            messageDetail: exceptionDetails.detail,
            showHeaderButtons: false,
            width: calculatedWidth,
            type: "error",
            height: 168,
            draggable: true,
            resizable: true,
            onClose: ($chk(pOnClose) && typeof pOnClose === "function") ? pOnClose : $.noop
        });
        jQuery("#exDetails").find("ul.tree").removeClass("tree").addClass("exception");

        return true;
    };

    this.handleCustomException = function (pExceptionData)
    {
        if (!this.isException(pExceptionData))
            return false;

        if (typeof pExceptionData === "string") //String object
            pExceptionData = parseXML(pExceptionData);

        var _xnException = pExceptionData.documentElement;
        var _xnMessage = _xnException.selectSingleNode("DisplayMessage");

        if (_xnMessage === null)
            _xnMessage = _xnException.selectSingleNode("Message");

        _xnException.removeChild(_xnMessage);

        var _isExtendedDetail = _xnException.getAttribute("ExtendedDetail") === "T";
        var messageDetail = "";
        var message = "";
        var text = this._formatText(_xnMessage.text);

        message = String.properObjectName(text);
        if (_isExtendedDetail)
            messageDetail = this._writeDetail(_xnException) + "</div>";


        var calculatedWidth = Math.floor(jQuery(window).width() / 10 * 9);
        if (calculatedWidth > 640)
        {
            calculatedWidth = 640;
        }
        masterPopupManager.showExtendedMessage({
            headerText: _xnException.getAttribute("Title"),
            message: message,
            //		messageDetail: messageDetail,
            showHeaderButtons: false,
            width: calculatedWidth,
            type: "error",
            height: 158,
            draggable: true,
            resizable: true
        });
        jQuery("#exDetails").find("ul.tree").removeClass("tree").addClass("exception");

        //jQuery("#ExceptionPanel").parent().eq(0).addClass("message-box-content error");

        return true;
    };

    this.handleExceptionErrorPage = function (pExceptionData)
    {
        var exceptionDetails = this.getVanillaExceptionDetails(pExceptionData);
        if (!checkExists(exceptionDetails)) return false;
        var postedExceptionDetails = {};
        postedExceptionDetails.errTitle = exceptionDetails.title;
        postedExceptionDetails.errMessage = exceptionDetails.message;
        postedExceptionDetails.errDetail = exceptionDetails.stack;

        $(window).off("beforeunload");
        this.redirectPost("Error.aspx", postedExceptionDetails);

        return true;
    };

    //handleAuthException
    this.handleAuthenticationException = function (pExceptionData, executionOptions, pOnCloseAuthLoginPopup)
    {
        if (!this.isAuthenticationException(pExceptionData))
        {
            return false;
        }

        if ($("#authExDialog").length === 0)
        {
            if (typeof pExceptionData === "string") //String object
            {
                pExceptionData = parseXML(pExceptionData);
            }

            var _xnException = pExceptionData.documentElement;
            var _redirectUrl = getNodeValue("RedirectURL", _xnException, "");

            if (checkExistsNotEmpty(_redirectUrl))
            {
                var calculatedWidth = Math.floor(jQuery(window).width() / 10 * 9);
                if (calculatedWidth > 500)
                {
                    calculatedWidth = 500;
                }

                var loginLinkHtml = "<a href='{0}' target='_blank'>{1}</a>";

                var loginLinkText = loginLinkHtml.format(_redirectUrl, Resources.ExceptionHandler.LoginLinkDisplay);

                var loginMessageHtml = "{0}<br/><br/>{1}";

                var authRequiredMessagePart1 = Resources.ExceptionHandler.AuthRequiredMessagePart1.format(loginLinkText);
                var authRequiredMessagePart2 = Resources.ExceptionHandler.AuthRequiredMessagePart2.format(Resources.WizardButtons.OKButtonText);

                var loginMessage = loginMessageHtml.format(authRequiredMessagePart1, authRequiredMessagePart2);

                masterPopupManager.showMessage({
                    id: "authExDialog",
                    headerText: Resources.ExceptionHandler.PleaseLoginHeader,
                    message: loginMessage,
                    showHeaderButtons: false,
                    width: calculatedWidth,
                    height: 158,
                    draggable: true,
                    resizable: true,
                    removeContentOnClose: true, // Remove content on close so any authentication exceptions after closing will be handled
                    modal: true,
                    onClose: function ()
                    {
                        if (_runtimeRetryAjaxQueue.length > 0)
                        {
                            //Retry only initial failed ajax call, but keep in queue in case of second round failure
                            //If initial retry succeeds, all queued ajax calls will also be retried
                            var initialRetryOptions = _runtimeRetryAjaxQueue[0];

                            initialRetryOptions.initialRetry = true;

                            ajaxCall.executeRuntimeBehaviour(initialRetryOptions);
                        }
                    },
                    onShow: function (popup)
                    {
                        popup.element.find(".popup-body-content > .scroll-wrapper").addClass("no-left-panel");
                    }
                });
            }
            else
            {
                var _xnExceptionCode = getNodeValue("ExceptionCode", _xnException, "");
                if (_xnExceptionCode === "CredentialsNotCached")
                {
                    var _xnProviderName = getNodeValue("ProviderFriendlyName", _xnException, "");
                    var _xnProviderTypeString = getNodeValue("ProviderTypeString", _xnException, "");
                    //Get the failing method name from the xml data
                    var _xnProviderMethod = "";
                    var jsonData = executionOptions.brokerPackagesJson;
                    if (checkExists(jsonData) && jsonData.length > 0 && checkExists(jsonData[0].metadata) && checkExists(jsonData[0].metadata.methodexecuted))
                    {
                        _xnProviderMethod = jsonData[0].metadata.methodexecuted;
                    }

                    var providerDetails =
                    {
                        providerName: _xnProviderName,
                        providerTypeString: _xnProviderTypeString,
                        providerMethod: _xnProviderMethod
                    }

                    var isInitialRetriedAjax = checkExists(executionOptions.initialRetry) ? executionOptions.initialRetry : false;

                    this._showAuthLoginPopup(providerDetails, pExceptionData, pOnCloseAuthLoginPopup, isInitialRetriedAjax);
                }
            }
        }

        return true;
    };

    //isException
    this.isException = function (pExceptionData, exceptionType)
    {
        if (pExceptionData === null)
            return false;

        var __Exception = "Exception";

        var result = false;

        //String object
        if (typeof pExceptionData === "string")
        {
            result = pExceptionData.length > 10 && pExceptionData.substr(0, 11) === '<' + __Exception + ' ';

            if (result && exceptionType !== undefined && exceptionType !== null)
            {
                pExceptionData = tryParseXML(pExceptionData);
            }
            else
            {
                return result;
            }
        }

        //XMLDocument object
        if (checkExists(pExceptionData) && typeof pExceptionData.documentElement !== "undefined")
        {
            result = pExceptionData.documentElement.nodeName === __Exception;

            if (result && exceptionType !== undefined && exceptionType !== null)
            {
                var extype = pExceptionData.selectSingleNode("Exception/Type");

                if (extype !== null && extype.text === exceptionType)
                {
                    return true;
                }
            }

            return result;
        }

        return false;
    };

    this.isCustomException = function (pExceptionData)
    {
        if (SourceCode.Forms.ExceptionHandler.isException(pExceptionData))
        {
            var exdoc = null;

            if (typeof pExceptionData.documentElement !== "undefined") //XMLDocument object
                exdoc = pExceptionData;
            else if (typeof pExceptionData === "string")
                exdoc = tryParseXML(pExceptionData);

            if (exdoc !== null)
            {
                var extype = exdoc.selectSingleNode("Exception/Type");

                if (extype !== null && extype.text === "SourceCode.Forms.Management.CustomException") return true;
            }
        }

        return false;
    };

    this.pageHasHtmlException = function (context)
    {
        if (!checkExists(context) || context.length === 0)
        {
            context = $("body");
        }
        var errorPanel = context.find(".intro-content.error");
        var hasError = (errorPanel.length > 0);
        return hasError;
    };

    this.isAuthenticationException = function (pExceptionData)
    {
        if (SourceCode.Forms.ExceptionHandler.isException(pExceptionData))
        {
            var exdoc = null;

            if (typeof pExceptionData.documentElement !== "undefined") //XMLDocument object
                exdoc = pExceptionData;
            else if (typeof pExceptionData === "string")
                exdoc = tryParseXML(pExceptionData);

            if (exdoc !== null)
            {
                var extype = exdoc.selectSingleNode("Exception/Type");

                if (extype !== null && extype.text === "SourceCode.Hosting.Exceptions.AuthenticationException") return true;
            }
        }

        return false;
    };

    this.loginContent = null;

    this._showAuthLoginPopup = function (providerDetails, pExceptionData, pOnCloseAuthLoginPopup, isInitialRetriedAjax)
    {
        //load login page
        var loginUrlFormat = "{0}LoginPopup.aspx";
        var loginUrl = loginUrlFormat.format(applicationRoot);

        var content = "";
        var valid = true;
        var loginDialog = null;
        var _this = this;

        if (!checkExists(this.loginContent))
        {
            valid = false;
            $.ajax({
                dataType: "text",
                url: loginUrl,
                type: "GET",
                async: true,
                success: function (data)
                {
                    if (SourceCode.Forms.ExceptionHandler.isException !== undefined && SourceCode.Forms.ExceptionHandler.isException(data))
                    {
                        SourceCode.Forms.ExceptionHandler.handleException(data);
                        valid = false;
                    }
                    else
                    {
                        valid = true;
                        _this.loginContent = data;
                        _this._formatAndShowLoginPopup(providerDetails, pExceptionData, pOnCloseAuthLoginPopup, isInitialRetriedAjax);
                    }
                },
                error: function (data)
                {
                    SourceCode.Forms.ExceptionHandler.handleException(data);
                    valid = false;
                }
            });
        }
        else
        {
            this._formatAndShowLoginPopup(providerDetails, pExceptionData, pOnCloseAuthLoginPopup, isInitialRetriedAjax);
        }

    }

    this._formatAndShowLoginPopup = function (providerDetails, pExceptionData, pOnCloseAuthLoginPopup, isInitialRetriedAjax)
    {
        var _this = this;
        var loginDialog = masterPopupManager.window.$("#AuthExLoginDialog");
        if (!checkExists(loginDialog) || loginDialog.length === 0)
        {
            loginDialog = masterPopupManager.window.$("<div id=\"AuthExLoginDialog\"></div>").appendTo("body");
        }

        loginDialog.empty().append("<div id=\"AuthExLoginDialogPanel\"></div>");
        var loginPanel = loginDialog.find("#AuthExLoginDialogPanel").panel();
        var loginBody = loginPanel.panel("fetch", "body");
        loginBody.html(this.loginContent);

        //show popup:
        var credentialsPopup = masterPopupManager.showPopup(
            {
                headerText: Resources.CommonLabels.LoginPopupHeader,
                modalize: true,
                content: loginDialog,
                buttons: [],
                cssClass: "credentialsPopupDialog",
                width: -1,
                height: -1 //width and height determined by css class credentialsPopupDialog
            });

        credentialsPopup.find("#SignInButton").addClass("SFC SourceCode-Forms-Controls-Web-Button");
        credentialsPopup.find("#SignInButton").SFCButton().off("click").on("click", function ()
        {
            _this._logInClicked(providerDetails, credentialsPopup).bind(_this);
        });
        credentialsPopup.find(".close").off("click").on("click", function ()
        {
            masterPopupManager.closeLast();
            if (checkExists(pOnCloseAuthLoginPopup) && typeof pOnCloseAuthLoginPopup === "function")
            {
                pOnCloseAuthLoginPopup();
            }
            else
            {
                SourceCode.Forms.ExceptionHandler.handleException(pExceptionData);
            }
        });
        credentialsPopup.find('#UserName,#Password,#ExtraData').textbox().textbox("setValue", "").on("blur", function ()
        {
            _this._validateCredentialTextBox($(this));
        });

        //update resource text according to providername and method:
        var credentialsRequiredReasonDiv = credentialsPopup.find("#divCredentialsRequiredReason");

        if (isInitialRetriedAjax)
        {
            credentialsRequiredReasonDiv.addClass("loginFailed");
            credentialsRequiredReasonDiv.html(Resources.CommonPhrases.LoginFailed);
        }
        else
        {
            credentialsRequiredReasonDiv.removeClass("loginFailed");
            if (SourceCode.Forms.Settings.ObfuscateMethodNames === false)
            {
                credentialsRequiredReasonDiv.html(Resources.CommonPhrases.CredentialsNeededText.format(providerDetails.providerName, providerDetails.providerMethod));
            }
            else
            {
                credentialsRequiredReasonDiv.html(Resources.CommonPhrases.CredentialsNeededNoMethodText.format(providerDetails.providerName));
            }
        }
        //By default, show and enable the extra data textbox, but do not set as required
        //this allows new providers not catered for to accept server/url field, but not require it.
        var enableExtraData = true;
        var requireExtraData = false;

        var extraDataDescription = Resources.CommonLabels.CredentialsExtraDataLabelDefault;
        //TODO Technical Debt item 0040: add provider values to configuration
        //customProviders to be added when necessary along with the corresponding Resources
        var customProviders = [];
        var providersRequired = ["CRM", "SALESFORCE", "SAP"];
        var providersExtraDataNotRequired = ["K2", "K2SQL", "SHAREPOINT", "SP"];
        /*----Extra data description depending on provider
		 * At the moment all labels will use default, but in event of provider requiring 
		 * custom label, resource name should be in format:
		 * "CredentialsExtraDataLabel" + "provider name" e.g. "CredentialsExtraDataLabelSAP"
		 *------------------------------------------*/
        var providerNameUpperCase = providerDetails.providerName.toUpperCase();

        if ((customProviders.length !== 0) && (customProviders.indexOf(providerNameUpperCase) > -1))
        {
            extraDataDescription = Resources.CommonLabels["CredentialsExtraDataLabel" + providerNameUpperCase];
        }
        else
        {
            extraDataDescription = Resources.CommonLabels.CredentialsExtraDataLabelDefault;
        }

        if (providersExtraDataNotRequired.indexOf(providerNameUpperCase) > -1)
        {
            enableExtraData = false;
            requireExtraData = false;
        }

        if (providersRequired.indexOf(providerNameUpperCase) > -1)
        {
            requireExtraData = true;
            enableExtraData = true;
        }

        if (!enableExtraData)
        {
            //disable extra data field
            credentialsPopup.find("#ExtraDataField")[0].setAttribute("disabled", "disabled");
            credentialsPopup.find("#ExtraData")[0].setAttribute("disabled", "disabled");
        }
        else
        {
            credentialsPopup.find("#ExtraDataField")[0].removeAttribute("disabled");
            credentialsPopup.find("#ExtraData")[0].removeAttribute("disabled");
        }
        credentialsPopup.find("#ExtraDataField").toggleClass("disabled", !enableExtraData);
        credentialsPopup.find("#ExtraData").toggleClass("disabled", !enableExtraData);
        var formatLabelWithColon = "{0}{1}";
        credentialsPopup.find("#ExtraDataField").find(".form-field-label").text(formatLabelWithColon.format(extraDataDescription, ":"));
        var extraDataTextbox = credentialsPopup.find("#ExtraData").textbox();
        extraDataTextbox.textbox("setWatermark", extraDataDescription);
        extraDataTextbox.textbox("setToolTip", extraDataDescription);
        credentialsPopup.find("#ExtraData").toggleClass("required", requireExtraData);
        credentialsPopup.find("#ExtraDataField").toggleClass("required", requireExtraData);
        extraDataTextbox.textbox("setReadOnly", !enableExtraData);

        credentialsPopup.find("#CacheCredentials").checkbox();
    };

    this._logInClicked = function (providerDetails, credentialsPopup)
    {
        var userNameTxt = credentialsPopup.find("#UserName");
        var passwordTxt = credentialsPopup.find("#Password");
        var extraDataTxt = credentialsPopup.find("#ExtraData");
        var cacheCredentialsCheckbox = credentialsPopup.find("#CacheCredentials");
        var userNameValid = this._validateCredentialTextBox(userNameTxt);
        var passWordValid = this._validateCredentialTextBox(passwordTxt);
        var extraDataValid = this._validateCredentialTextBox(extraDataTxt);
        if (userNameValid && passWordValid && extraDataValid)
        {
            var credentials =
                {
                    username: userNameTxt.val(),
                    password: passwordTxt.val(),
                    extradata: extraDataTxt.val(),
                    cacheCredentials: cacheCredentialsCheckbox[0].checked,
                    providerName: providerDetails.providerName,
                    providerTypeString: providerDetails.providerTypeString
                };
            this._resendRequestForAuthentication(credentials);
            masterPopupManager.closeLast();
        }
    };

    this._resendRequestForAuthentication = function (credentials)
    {
        if (_runtimeRetryAjaxQueue.length > 0)
        {
            //Retry only initial failed ajax call, but keep in queue in case of second round failure
            //If initial retry succeeds, all queued ajax calls will also be retried
            var initialRetryOptions = _runtimeRetryAjaxQueue[0];

            initialRetryOptions.initialRetry = true;
            if (checkExists(credentials))
            {
                initialRetryOptions.credentials = credentials;
            }

            ajaxCall.executeRuntimeBehaviour(initialRetryOptions);
        }
    };

    this._validateCredentialTextBox = function (textBox)
    {
        var txtWrapper = textBox.closest(".input-control.text-input");
        if (txtWrapper.hasClass("required") || textBox.hasClass("required"))
        {
            if (!checkExistsNotEmpty(textBox.val()))
            {
                var objInfo =
                    {
                        CurrentControlId: textBox[0].id,
                        Error: true,
                        IsRequired: true,
                        IgnoreInvisible: true,
                        IgnoreReadOnly: true,
                        IgnoreDisabled: true
                    };
                txtWrapper.addClass("invalid");
                UtilitiesHelper.showValidationMessage(textBox, objInfo);
                txtWrapper.on("mouseover", { txtBox: textBox }, this._onInvalidCredentialOver.bind(this));
                txtWrapper.on("mouseout", { txtBox: textBox }, this._onInvalidCredentialOut.bind(this));
                return false;
            }
            else
            {
                txtWrapper.removeClass("invalid");
                txtWrapper.off("mouseover").off("mouseout");
                return true;
            }
        }
        else
        {
            return true;
        }
    };

    this._onInvalidCredentialOver = function (ev)
    {
        $("#" + ev.data.txtBox[0].id + "_Tooltip").show();
    };

    this._onInvalidCredentialOut = function (ev)
    {
        $("#" + ev.data.txtBox[0].id + "_Tooltip").hide();
    };

    this.SmartObjectNotFound =
        {
            _list: {},
            _timeout: 1000,

            _getTimeStamp: function ()
            {
                return Date.now();
            },

            check: function (smartobjectid)
            {
                var result = false;
                var previousException = SFE.SmartObjectNotFound._list[smartobjectid];
                if (checkExists(previousException))
                {
                    var timeStamp = SFE.SmartObjectNotFound._getTimeStamp();
                    if ((timeStamp - previousException.timeStamp) <= SFE.SmartObjectNotFound._timeout)
                    {
                        result = true;
                    }
                    else
                    {
                        SFE.SmartObjectNotFound._list[smartobjectid] = null;
                        result = false;
                    }
                }
                return result;
            },

            process: function (data, smartobjectid)
            {
                var exceptionData = parseXML(data);
                var isSmartObjectNotFoundException = checkExists(exceptionData.selectSingleNode("/Exception[Type='SourceCode.SmartObjects.Client.SmartObjectNotFoundException']"));
                if (isSmartObjectNotFoundException)
                {
                    SFE.SmartObjectNotFound._list[smartobjectid] =
                        {
                            timeStamp: SFE.SmartObjectNotFound._getTimeStamp(),
                            exception: data
                        }
                }
            }
        };


    //Generic Error Handling:
    //checks the status of a request and its content (for custom server errors)
    this.AjaxUnsuccessful = function (xhr, status, data)
    {

        var result = (["error", "timeout", "abort"].indexOf(status) !== -1 || [0, 12029].indexOf(xhr.status) !== -1);

        //check for custom errors
        if (result === false)
        {
            if (typeof (SourceCode.Forms.ExceptionHandler.isException) === "function")
            {
                result = SourceCode.Forms.ExceptionHandler.isException(data) || SourceCode.Forms.ExceptionHandler.isCustomException(data);
            }
        }

        //check for xml custom errors
        if (result === false && !!xhr.responseXML)
        {
            result = (checkExists(data.selectSingleNode("Error")));
        }

        return result;

    },

        this.AjaxAborted = function (xhr, status, data)
        {
            return (xhr.status === 0 && xhr.statusText === 'abort')
        },

        this.IsAjaxInProgress = function (ajaxCall)
        {
            var ajaxInProgress = false;

            if (checkExists(ajaxCall) && ajaxCall.readyState !== this.AJAX_READYSTATE_REQUEST_COMPLETE)
            {
                ajaxInProgress = true;
            }

            return ajaxInProgress;
        },

        this.AddErrorHTML = function (jqParent, xhr, status, data, cssClasses)
        {
            var info = this.GetErrorDetails(xhr, status, data);
            return this.AddErrorHTMLFromErrorInfo(jqParent, info, cssClasses);
        }

    this.AddErrorHTMLFromErrorInfo = function (jqParent, errorInfo, cssClasses)
    {
        var template =
            "<div style=\"text-align:left\" class=\"error-page {2}\"> \
<table class=\"error-page-layout-table\"> \
	<tbody> \
		<tr> \
			<td > \
				<div class=\"error-page-content {2}\"> \
					<span class=\"{2} icon icon-size64 ic-error\"></span> \
					<h2 class=\"h2 error\">{0}</h2> \
					<span class=\"{2} instruction\">{1}</span> \
				</div> \
			</td> \
		</tr> \
	</tbody> \
</table> \
</div>";

        var html = template.format(errorInfo.title, errorInfo.message, (!!cssClasses) ? cssClasses : "");
        jqParent.append(html);
        return jqParent;
    }


    //should only return true if the server was able to be contacted, but the server returned an error.
    this.IsServerError = function (xhr, status, data)
    {
        if (xhr.state() === "rejected" || [12029].indexOf(XMLHttpRequest.status) !== -1)
        {
            return false;
        }
        else if (status === "timeout")
        {
            return false;
        }
        return true;
    }

    //Generic Error Handling:
    //returns an object with title, message, detail and custom properties. (DTO)
    //deals with timeout, web server errors, custom errors etc.
    this.GetErrorDetails = function (xhr, status, data)
    {
        var message = "";
        var title = "";
        if (xhr.state() === "rejected" || [12029].indexOf(XMLHttpRequest.status) !== -1)
        {
            message = Resources.AppStudio.GenericNoConnectionMessage;
        }
        else if (status === "timeout")
        {
            message = Resources.AppStudio.GenericTimeoutMessage;
        }
        else if (status === "error" && [0, 12007].indexOf(XMLHttpRequest.status) !== -1)
        {
            //Network Issue (Other than no connection ).
            message = Resources.ExceptionHandler.WebServerErrorSource;
        }
        else
        {
            var info = SourceCode.Forms.ExceptionHandler.getExceptionDetails(data);
            if (info != null)
            {
                return info;
            }
            else
            {
                if (typeof data === "string" && checkExistsNotEmpty(data) && status !== "abort") //String object
                {
                    message = data;
                }
                else if (checkExists(data) && checkExists(data.selectSingleNode("Error")))
                {
                    message = data.selectSingleNode("Error").text;
                }
                else
                {
                    message = Resources.AppStudio.UnknownErrorMessage;
                }
            }
        }

        var iscustom = typeof (SourceCode.Forms.ExceptionHandler.isException) === "function" &&
            SourceCode.Forms.ExceptionHandler.isException(data) &&
            SourceCode.Forms.ExceptionHandler.isCustomException(data);

        //make sure there is always a title!
        if (title == "") title = Resources.ExceptionHandler.WebServerErrorType;

        return {
            title: title,
            message: message,
            detail: null,
            custom: iscustom
        }

    }
};
