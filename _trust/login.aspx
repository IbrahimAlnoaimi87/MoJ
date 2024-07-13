<%@ Page Language="C#" AutoEventWireup="true" MasterPageFile="~/MasterPages/Home.master" CodeBehind="login.aspx.cs" Inherits="SourceCode.Security.Claims.Web._trust.login, SourceCode.Security.Claims.Web, Version=4.0.0.0, Culture=neutral, PublicKeyToken=16a2c5aaaa1b130d" %>

<%@ Register Assembly="SourceCode.Security.Claims.Web, Version=4.0.0.0, Culture=neutral, PublicKeyToken=16a2c5aaaa1b130d" Namespace="SourceCode.Security.Claims.Web.Controls" TagPrefix="K4" %>
<asp:Content ID="HomeContent" ContentPlaceHolderID="HomeContentPlaceHolder" runat="server">
    <link href="../Styles/Platinum2/CSS/forms.css" rel="stylesheet" />
    <link href="../Styles/Platinum2/CSS/home.css" rel="stylesheet" />
    <link href="../Styles/Platinum2/CSS/login.css" rel="stylesheet" />
    <link href="../Styles/Platinum2/CSS/introduction.css" rel="stylesheet" />
    <link href="../Styles/Platinum2/CSS/fonts.css" rel="stylesheet" />
    <K4:Panel ID="SignInPanel" runat="server" Behavior="FullSize">
        <Content>
            <div class="main-logo"></div>
            <div class="stsMethodsWrapper">
                <div class="stsMethodsContent">
                    <asp:Label runat="server" ID="LoginMethod" CssClass="stsLoginMethod"><%:GetGlobalResourceObject("Introduction", "LoginMethod")%></asp:Label>
                    <ul class="stsIssuerList">
                        <asp:PlaceHolder ID="issuerList" runat="server"></asp:PlaceHolder>
                    </ul>
                </div>
            </div>
            <noscript>
                <%:GetGlobalResourceObject("CommonActions", "NoScriptContent") %>
            </noscript>
        </Content>
    </K4:Panel>
    <script type="text/javascript">
        $(function ()
        {
            try
            {
                try
                {
                    parent.postMessage("sfrtFormReady", "*");
                }
                catch (e)
                {
                    window.postMessage("sfrtFormReady", "*");
                };

                SourceCode.Forms.InjectBrowserUserAgentToHtml();

                $(".home-header-c").remove(); //Show top bar without content
                //Add login class so we can treat some css styling for the login page separately
                $(".home-header").addClass("login");
                $(".home-content").addClass("login");
                $("html").addClass("login");

                if (checkExists(parent.location.href))
                {
                    var parentUrl = parent.location.href;
                    var queryStringIndex = parentUrl.indexOf('?');
                    if (queryStringIndex > 0)
                    {
                        parentUrl = parentUrl.substring(0, queryStringIndex);
                    }
                    if (parentUrl.toUpperCase().indexOf("HOST.ASPX") > 0)
                    {
                        $("body").addClass("collapsed-header");
                    }
                }
            }
            catch (e)
            {
            }
        });
    </script>
</asp:Content>
<asp:Content ID="Content5" ContentPlaceHolderID="LocalVariables" runat="server">
</asp:Content>
