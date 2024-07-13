<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="View.aspx.cs" Async="true" Inherits="SourceCode.Forms.Web.Runtime.View" %>

<!DOCTYPE html>
<!-- Generated on <%=DateTime.UtcNow.ToString("o") %> -->
<html dir="<%=GetGlobalResourceObject("Default", "HTMLDirectionality") %>" class="<%=IsMobile(Request.UserAgent.ToLower()) ? "mobile touch" : "desktop" %>">
<head runat="server">
    <title>View Runtime</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
</head>
<body style="overflow-y: <%=HttpUtility.HtmlAttributeEncode(overFlowY.Replace(";",""))%>;" class="theme-entry runtime-view">
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
                try {
                    parent.postMessage("sfrtViewReady", "*");
                }
                catch (e) {
                    window.postMessage("sfrtViewReady", "*");
                };
            }
            catch (e) {
            }
        });
    </script>
</body>
</html>
