<%@ Page Language="C#" MasterPageFile="~/MasterPages/Generic.master" AutoEventWireup="true" CodeBehind="Login.aspx.cs" EnableViewState="false" Inherits="SourceCode.Forms.Login" Title="<%$ Resources: Default,PageHeading %>" ClientIDMode="Static" %>

<asp:Content ID="PageContent" ContentPlaceHolderID="PageContent" runat="server">
    <div id="SignInWrapper"><!-- Don't remove the #SingInWrapper, it is used in SessionManagement.js to identify if it is login page -->
        <div class="stsLoginInPanel" runat="server" id="SignInPanel">
            <div class="stsHeader"></div>
            <div class="stsMainLogo"></div>
            <!-- layout system - center+middle, and scrollbars -->
            <div class="stsMain">
                <div class="layout-table">
                    <div class="layout-table-row">
                        <div class="layout-table-cell">
                            <div class="layout-table-cell-alignment">
                                <!-- content -->
                                <div class="stsLoginDetails">
                                    <div class="stsLoginUserName" title="<%=GetGlobalResourceObject("CommonLabels", "UserNameTooltip")%>">
                                        <input id="UserName" class="input-control required watermark" name="UserName" type="text">
                                    </div>
                                    <div class="stsLoginUserNamePlaceHolder validation-error">
                                    </div>
                                    <div class="stsPassword" class="input-control text-input" title="<%=GetGlobalResourceObject("CommonLabels", "PasswordTooltip")%>">
                                        <input id="Password" class="input-control required watermark" name="Password" type="password">
                                    </div>
                                    <div class="stsPasswordPlaceHolder validation-error">
                                    </div>
                                    <div class="stsRememberMe" style="display: none">
                                        <k3:Checkbox ID="RememberMe" runat="server" IsVisible="false" Name="RememberMe" Value="true" />
                                    </div>
                                    <div class="stsRememberMePlaceHolder">
                                    </div>
                                    <div class="stsSignInButton">
                                        <a id="SignInButton" class="button" href="javascript:void(0)"><%=GetGlobalResourceObject("CommonActions", "SignInText")%></a>
                                    </div>
                                    <div class="button preload-icon loading"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="stsFooter">
                <div class='PageHelpLink'><%=GetGlobalResourceObject("Introduction", "LoginHelpLink")%></div>
            </div>
        </div>
    </div>
    <asp:PlaceHolder ID="ErrorMessagePH" runat="server" />
    <script type="text/javascript">
        $(function () {
            try {
                try {
                    parent.postMessage("sfrtFormReady", "*");
                }
                catch (e) {
                    window.postMessage("sfrtFormReady", "*");
                };

                if (checkExists(parent.location.href)) {
                    var parentUrl = parent.location.href;
                    var queryStringIndex = parentUrl.indexOf('?');
                    if (queryStringIndex > 0) {
                        parentUrl = parentUrl.substring(0, queryStringIndex);
                    }
                    if (parentUrl.toUpperCase().indexOf("HOST.ASPX") > 0) {
                        $("body").addClass("collapsed-header");
                    }
                }
            }
            catch (e) {
            }
        });
    </script>
</asp:Content>
