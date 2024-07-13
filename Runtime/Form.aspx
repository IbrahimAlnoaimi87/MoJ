<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Form.aspx.cs" Async="true" Inherits="SourceCode.Forms.Web.Runtime.Form" %>

<!DOCTYPE html>
<!-- Generated on <%=DateTime.UtcNow.ToString("o") %> -->
<html dir="<%=GetGlobalResourceObject("Default", "HTMLDirectionality") %>" class="<%=IsMobile(Request.UserAgent.ToLower()) ? "mobile touch" : "desktop" %>">
<head runat="server">
    <title>Form Runtime</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
	
	 <link href=
"https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css"
          rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
	 <link href="./Styles/output.css" rel="stylesheet">
</head>
<body style="overflow-y: <%=HttpUtility.HtmlAttributeEncode(overFlowY.Replace(";",""))%>; background-color: <%=HttpUtility.HtmlAttributeEncode(backgroundColor.Replace(";",""))%>; background-image: <%=HttpUtility.HtmlAttributeEncode(backgroundImage.Replace(";",""))%>; background-repeat: <%=HttpUtility.HtmlAttributeEncode(backgroundRepeat.Replace(";",""))%>; background-size: <%=HttpUtility.HtmlAttributeEncode(backgroundSize.Replace(";",""))%>; background-position: <%=HttpUtility.HtmlAttributeEncode(backgroundPosition.Replace(";",""))%>;" class="theme-entry <%=cssClass%>">
    <span id="__runtimeStatus" style="display: none">loading</span>
    <span id="__runtimeWhoAmI" style="display: none; background: lime; font-size: 24pt">unknown</span>
    <div id="__initialModalizer" class="base2 base1 modalizer<%=(!RenderedShowOverLay) ? " invisible-modalizer" : ""  %>" 
        style="z-index: 1; <%=(InitialOverlayOpacity != "-1") ? string.Format("opacity: {0};", InitialOverlayOpacity) : ""  %>">
        <div class="base0 base1 ajaxLoader" style="<%=(!RenderedShowBusy) ? "display:none;" : ""%>"></div>
    </div>
    <form id="form1" runat="server">
        <iframe id="HiddenFileFrame" name="HiddenFileFrame"></iframe>
    </form>
    <% if (!_hasServerEvents) { %>
    <asp:Substitution ID="OutputCacheSubstitution"
        MethodName="PerformOutputSubstitutions"
        runat="Server"></asp:Substitution>
    <% } else { %>
    <asp:Literal ID="CustomOutputCacheSubstitution" runat="server"></asp:Literal>
    <%}%>
    <script type="text/javascript">
        $(function () {
            try {
                try
                {
                    parent.postMessage("sfrtFormReady", "*");
                }
                catch (e) {
                    window.postMessage("sfrtFormReady", "*");
                };
            }
            catch (e) {
            }
        });
    </script>
    <%      if (acceptsPostMessages) { %>
    <script type="text/javascript">
        $(function ()
        {
            let knownAllowedMessages = ["sfrtViewReady", "sfrtFormReady", "sfErrorReady"];

            var mostRecentStyleProfileData = {};

            window.addEventListener("message", function (evt)
            {
                if (evt.origin === window.location.origin)
                {
                    if (evt.data.type === "apply-style-profile")
                    {
                        // Merge style profile data
                        $.extend(mostRecentStyleProfileData, evt.data);
                        applyStyleProfile(evt.data.variables, evt.data.cssFiles, evt.data.jsFiles);

                        // find subforms
                        applySubformStyleProfile(
                            $(".runtime-popup").toArray().map(x => x.contentWindow),
                            evt.data.variables,
                            evt.data.cssFiles,
                            evt.data.jsFiles
                        );
                    }
                    // The event when a subform form has loaded
                    else if (evt.data === "sfrtFormReady" && evt.currentTarget)
                    {
                        applySubformStyleProfile(
                            evt.currentTarget,
                            mostRecentStyleProfileData.variables,
                            mostRecentStyleProfileData.cssFiles,
                            mostRecentStyleProfileData.jsFiles
                        );
                    }
                    // The event when a subview has loaded
                    else if (evt.data === "sfrtViewReady" && evt.currentTarget) {
                        applySubviewStyleProfile(
                            evt.currentTarget,
                            mostRecentStyleProfileData.variables,
                            mostRecentStyleProfileData.cssFiles,
                            mostRecentStyleProfileData.jsFiles
                        );
                    }
                    else if (knownAllowedMessages.indexOf(evt.data) === -1)
                    {
                        console.warn("Unknown message type received: " + evt.data);
                        console.log(evt); // console.error doesn't log nice objects
                    }
                }
            });
        });
    </script>
    <%} %>
<h1 class="text-3xl font-bold underline text-red">
    Hello world!
  </h1>
</body>
 <script src="./Script/tailwind.config.js"></script>
</html>
