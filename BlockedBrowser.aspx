<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="BlockedBrowser.aspx.cs" Inherits="SourceCode.Forms.BlockedBrowser" %>

<!DOCTYPE html>

<html dir="<%=GetGlobalResourceObject("Default", "HTMLDirectionality") %>">
<head runat="server">
    <title></title>
    <link href="<%= Page.ResolveUrl("~/Styles/Platinum2/CSS/blockedbrowser.css") %>" rel="stylesheet" type="text/css" />
</head>
<body>
<form id="form1" runat="server" behavior="FullSize">
    <div id="bbContainer" class="blockedbrowser-outer-panel">
        <div class="blockedbrowser-middle-panel">
            <div class="blockedbrowser-k2-smartforms-logo">
                <img src="<%= Page.ResolveUrl("~/Styles/Platinum2/Images/Icons/Management/K2LogoPermissions64.png")%>" alt="Permissions logo" />
            </div>
            <div class="browser-not-supported-heading" id="heading">
                <%=GetLocalResourceObject("BrowserNotSupportedHeading").ToString()%>
            </div>
            <div class="browser-not-supported-text" id="content">
                <%= SetContentText() %>
            </div>
            <div class="blockedbrowser-chrome-name" id="chrome">
                <%=GetLocalResourceObject("ChromeName").ToString()%>
            </div>
            <div class="blockedbrowser-edge-name" id="edge">
                <%=GetLocalResourceObject("EdgeName").ToString()%>
            </div>
            <div class="blockedbrowser-help-link" id="help">
                <%=GetHelpText()%>
            </div>
        </div>
    </div>
    <div class="hidden" id="cmContainer">
        <h2><%=GetLocalResourceObject("BrowserCompatibilityNotSupportedHeading").ToString()%></h2>
        <p class="cm-content" id="cmContent"><%=GetLocalResourceObject("BrowserCompatibilityNotSupportedText").ToString()%></p>
        <p id="helpAlt" class="cm-help-link"><%=GetWebpartHelpText()%></p>
    </div>
    <script type="text/javascript">
        function detectCompatibilityMode()
        {
            var isIE, tmp;

            tmp = document.documentMode;
            try
            {
                document.documentMode = "";
            } catch (e) { };

            isIE = typeof document.documentMode == "number" || new Function("return/*@cc_on!@*/!1")();

            try
            {
                document.documentMode = tmp;
            } catch (e) { };

            if (isIE)
            {
                var e, obj = document.createElement("div"), x,
                    verIE_ua = (/^(?:.*?[^a-zA-Z])??(?:MSIE|rv\s*\:)\s*(\d+\.?\d*)/i).test(navigator.userAgent || "") ?
                        parseFloat(RegExp.$1, 10) : null;
                verIEtrue = null,  // True IE version [string/null]
                    verTrueFloat = null,
                    docModeIE = null,
                    CLASSID = [
                        "{45EA75A0-A269-11D1-B5BF-0000F8051515}",  // Internet Explorer Help
                        "{3AF36230-A269-11D1-B5BF-0000F8051515}",   // Offline Browsing Pack 
                        "{89820200-ECBD-11CF-8B85-00AA005B4383}"
                    ];

                try
                {
                    obj.style.behavior = "url(#default#clientcaps)"
                }
                catch (e)
                {
                };

                for (x = 0; x < CLASSID.length; x++)
                {
                    try
                    {
                        verIEtrue = obj.getComponentVersion(CLASSID[x], "componentid").replace(/,/g, ".")
                    }
                    catch (e)
                    {
                    };
                    if (verIEtrue) break;
                };

                docModeIE = document.documentMode || ((/back/i).test(document.compatMode || "") ? 5 : verTrueFloat) ||
                    verIE_ua;

                // If IE8 or earlier, or IE8 or earlier compatibility mode
                if (verIEtrue)
                {
                    var ieBrowserVersion =  verIEtrue.substr(0, 2);
                    if (docModeIE < 9 && ieBrowserVersion > docModeIE)
                    {
                        adjustMessagesForCompatibilty();
                    }
                }
            }
				
        }

        function detectIframe()
        {
            try
            {
                return window.self !== window.top;
            } catch (e)
            {
                return true;
            }
        }

        function getQueryStringObject()
        {
            var result = {}, queryString = location.search.slice(1),
                re = /([^&=]+)=([^&]*)/g, m;

            while (m = re.exec(queryString))
            {
                result[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
            }

            return result;
        }

        function htmlEncode(str)
        {
            return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        function adjustMessagesForCompatibilty()
        {
            var inIframe = detectIframe();
            if (inIframe)
            {
                var referrer = getQueryStringObject().referrer;
                if (referrer == null) //do not change to ===
                {
                    referrer = document.referrer;
                }
                // Hide the blocked browser page.
                var blockBContainerElem = document.getElementById("bbContainer");
                blockBContainerElem.className += " hidden";

                var contentText = "<%=GetLocalResourceObject("BrowserCompatibilityNotSupportedHostingPageText").ToString()%>";
                var anchorText = "<a href=\"{0}\" target=\"_blank\">{1}</a>".replace("{0}", htmlEncode(referrer)).replace("{1}", "<%=GetLocalResourceObject("FormReOpenLinkAnchorText").ToString()%>");
                var linkHtml = "<%=GetLocalResourceObject("FormReOpenLinkText").ToString()%>".replace("{0}", anchorText);

                var compatContentElem = document.getElementById("cmContent");
                compatContentElem.innerHTML = contentText + "<br/>" + linkHtml;

                // Show the incompatible browser page.
                var compatModeElem = document.getElementById("cmContainer");
                compatModeElem.className = "";
            }
            else
            {
                var heading = document.getElementById("heading");
                var content = document.getElementById("content");
                var ie = document.getElementById("ie");
                var edge = document.getElementById("edge");
                var chrome = document.getElementById("chrome");
                var helpItem = document.getElementById("help");
                var helpAltItem = document.getElementById("helpAlt");

                heading.innerHTML = "<%=GetLocalResourceObject("BrowserCompatibilityNotSupportedHeading").ToString()%>";
                content.innerHTML = "<%=GetLocalResourceObject("BrowserCompatibilityNotSupportedText").ToString()%>";
                ie.style.display = "none";
                edge.style.display = "none";
                chrome.style.display = "none";
                helpItem.innerHTML = helpAlt.innerHTML;
            }
        }
        detectCompatibilityMode();
    </script>
</form>
</body>
</html>
