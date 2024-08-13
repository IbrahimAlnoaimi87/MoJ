(function ($)
{
	if (typeof SourceCode === "undefined" || SourceCode === null) SourceCode = {};
	if (typeof SourceCode.Forms === "undefined" || SourceCode.Forms === null) SourceCode.Forms = {};

	SourceCode.Forms.XSRFHelper =
	{
		checkIfXSRFCookieAndTokenExists: function()
		{
			if (typeof __antiXsrfEnabled !== "undefined" && __antiXsrfEnabled !== null)
			{
				return checkExists(__antiXsrfEnabled) && __antiXsrfEnabled && checkExists(__xsrfTokenName) && checkExists(__xsrfCookieName);
			}
		},

		setAntiXSRFHeader: function (xhr)
		{
			if (SourceCode.Forms.XSRFHelper.checkIfXSRFCookieAndTokenExists())
			{
				xhr.setRequestHeader(__xsrfTokenName, Cookies.get(__xsrfCookieName));
			}
		},

		setAntiXSRFTokenInHeaderCollection: function (headers)
		{
			if (SourceCode.Forms.XSRFHelper.checkIfXSRFCookieAndTokenExists())
			{
				headers[__xsrfTokenName] = Cookies.get(__xsrfCookieName);
			}
		},

		appendAntiXSRFQueryStringParameter: function (url)
		{
			var separatorChar = "";
			if (checkExists(url))
			{
				if (url.indexOf("?") > 0)
				{
					separatorChar = "&";
				}
				else
				{
					separatorChar = "?";
				}
			}
			else
			{
				url = "";
			}

			if (SourceCode.Forms.XSRFHelper.checkIfXSRFCookieAndTokenExists())
			{
				url = url + separatorChar + __xsrfTokenName + "=" + Cookies.get(__xsrfCookieName);
			}
			return url;
		}
	}
})(jQuery);

// Set by default that ajax requests add a XSRF token in the header using the XSRF cookie value 
$.ajaxSetup({
	beforeSend: function (xhr)
	{
		SourceCode.Forms.XSRFHelper.setAntiXSRFHeader(xhr);
	}
});
