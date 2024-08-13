<%@ Page Title="<%$ Resources: Default,PageHeading %>" Language="C#" MasterPageFile="~/MasterPages/Home.master" AutoEventWireup="true" CodeBehind="Host.aspx.cs" Inherits="SourceCode.Forms.Host" %>

<%@ Register Src="~/UserControls/UserAvatar.ascx" TagPrefix="k4" TagName="UserAvatar" %>

<asp:Content ID="HeaderContent" ContentPlaceHolderID="MainHeaderContentPlaceholder" runat="server">
    <div class="appbar-backbutton-container">
        <a class="appbar-backbutton"><span class="icon icon-size16 ic-back dark"></span><label class="appbar-backbutton-label">Back</label></a>
    </div>

    <k4:UserAvatar runat="server" ID="UserAvatar" IsMe="true" CssClass="main-avatar" AdditionalIconCssClass="dark" ShowLogout="false"/>
</asp:Content>

<asp:Content ID="SystemInfoContent" ContentPlaceHolderID="SystemInfoContentPlaceHolder" runat="server">
    <%=GetGlobalResourceObject("CommonPhrases", "PoweredByText") %>
</asp:Content>

<asp:Content ID="HomeContentPlaceHolder" ContentPlaceHolderID="HomeContentPlaceHolder" runat="server">

    <iframe id="DesignerIframe" name="DesignerIframe" frameborder="0" style="width: 100%; height: 100%; position: relative;"></iframe>

    <script type="text/javascript">
        
        window.onload = function ()
        {
            $(".avatar-control").avatar();
            var appbarBackbuttonLabel = document.getElementsByClassName("appbar-backbutton-label");
            var appbarBackButton = document.getElementsByClassName("appbar-backbutton");

            if ((typeof appbarBackbuttonLabel !== "undefined") && (appbarBackbuttonLabel !== null) && (appbarBackbuttonLabel.length !== 0))
            {
                var decodedParamterString = decodeURIComponent(window.location.search);
                var sourceTitle = getQueryStringParameter(window.location.search, "sourceTitle");
                var sourceTitleFromDecodedUrl = getQueryStringParameter(decodedParamterString, "sourceTitle")
                if (sourceTitle === undefined && sourceTitleFromDecodedUrl !== undefined)
                {
                    sourceTitle = sourceTitleFromDecodedUrl;
                }
                if (sourceTitle === null || sourceTitle === '')
                {
                    //Default to 'Back' if no sourceTitle is specified.
                    sourceTitle = '<%= Resources.Default.Back %>';
                }
                else
                {
                    //Decode the sourceTitle received in the querystring.
                    sourceTitle = decodeURIComponent(sourceTitle);
                }
                var source = decodeURIComponent(getQueryStringParameter(window.location.search, "source"));
                var sourceFromDecodedUrl = getQueryStringParameter(decodedParamterString, "source")
                if (source === "undefined" && sourceFromDecodedUrl !== undefined)
                {
                    source = sourceFromDecodedUrl;
                }
                if (source.test(stringRegularExpressions.isValidWebURLScheme))
                {
                    appbarBackButton[0].href = source;
                }

                while(appbarBackbuttonLabel[0].firstChild)
                {
                    appbarBackbuttonLabel[0].removeChild(appbarBackbuttonLabel[0].firstChild);
                }

                var appbarBackButtonContainer = document.getElementsByClassName("appbar-backbutton-container");
                if ((typeof appbarBackButtonContainer !== "undefined") && (appbarBackButtonContainer !== null) && (appbarBackButtonContainer.length !== 0))
                {
                    appbarBackButtonContainer[0].onclick = function () { window.location = appbarBackButton[0].href };
                    appbarBackbuttonLabel[0].appendChild(document.createTextNode(sourceTitle.htmlEncode()));
                    appbarBackbuttonLabel[0].setAttribute("class", "appbar-backbutton-label");
                }

            }

            var homeHeader = document.getElementsByClassName("home-header");

            if ((typeof homeHeader !== "undefined") && (homeHeader !== null) && (homeHeader.length !== 0))
            {
                homeHeader[0].classList.add("showexplorer");
            }

            // Set the iframe source to the value that is passed into the querystring.
            var contentUrl = decodeURIComponent(getQueryStringParameter(window.location.search, "contenturl"));
            if (contentUrl.test(stringRegularExpressions.isValidWebURLScheme))
            {
                document.getElementsByName("DesignerIframe")[0].src = contentUrl;
            }
        }

        function getQueryStringParameter(queryString, paramToRetrieve)
        {
            var paramSets;
            var params;
            var param;

            paramSets = queryString.split("?");

            for (var j = 0; j < paramSets.length; j = j + 1) {
                if (paramSets[j].indexOf("&amp;") != -1) {
                    params = paramSets[j].split("&amp;");
                }
                else {
                    params = paramSets[j].split("&");
                }

                for (var i = 0; i < params.length; i = i + 1) {
                    if (params[i].indexOf("=") != -1) {
                        param = params[i].split("=");

                        if (param[0].toLowerCase() == paramToRetrieve.toLowerCase())
                        {
                            return param[1];
                        }
                    }
                }
            }
        }

        $("#DesignerIframe").on('load', function ()
        {
            var showAvatar = true;
            try
            {
                var newUrl = $("#DesignerIframe").get(0).contentWindow.location.href;
                var newUrlAddress = newUrl;
                var queryStringIndex = newUrlAddress.indexOf("?");
                if (queryStringIndex > 0)
                {
                    newUrlAddress = newUrl.substring(0, queryStringIndex).toUpperCase();
                }
                if (newUrlAddress.indexOf("LOGIN.ASPX") > 0 || newUrlAddress.indexOf("/LOGIN") === newUrlAddress.length - 6)
                {
                    showAvatar = false;
                }
                if (showAvatar)
                {
                    $(".main-avatar").show();
                }
                else
                {
                    $(".main-avatar").hide();
                }
            }
            catch(e)
            {
            }
        });
        
    </script>

</asp:Content>
<asp:Content ID="Content4" ContentPlaceHolderID="LocalVariables" runat="server">
</asp:Content>
