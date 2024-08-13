<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="StandAloneErrorPage.aspx.cs" Inherits="SourceCode.Forms.ErrorPages.StandAloneErrorPage" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
    <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0, user-scalable=no, width=device-width"/>
    <link rel="stylesheet" href="<%= Page.ResolveUrl("~/Styles/Platinum2/CSS/Standalone.css")%>" type="text/css" />
    <link rel="stylesheet" href="<%= Page.ResolveUrl("~/Styles/Platinum2/CSS/layout.css")%>" type="text/css" />
    <link rel="stylesheet" href="<%= Page.ResolveUrl("~/Styles/Platinum2/CSS/common.css")%>" type="text/css" />
    <link rel="stylesheet" href="<%= Page.ResolveUrl("~/Styles/Platinum2/CSS/fonts.css")%>" type="text/css" />
    <link rel="stylesheet" href="<%= Page.ResolveUrl("~/Styles/Platinum2/CSS/login.css")%>" type="text/css" />
    <link rel="icon" type="image/png" href="<%= Page.ResolveUrl("~/Styles/Platinum2/Images/favicon.png")%>" />
</head>
<body id="StandAloneBody">
<div class="errorPage">
        <div class="mainContent">
            <!-- layout system - center+middle, and scrollbars -->
            <div class="layout-table">
                <div class="layout-table-row">
                    <div class="layout-table-cell fullWidth">
                        <div class="layout-table-cell-alignment mediumWidth mediumHeight">
                                <div class="standaloneImage"></div>
                                <div class="standaloneTitle">
                                    <%=GetGlobalResourceObject("Default", "StandAloneTitle")%>
                                </div>
                                <div class="standaloneDescription">
                                    <p>
                                        <%=GetGlobalResourceObject("Default", "StandAloneDescription_line1")%>
                                        <br />
                                        <%=GetGlobalResourceObject("Default", "StandAloneDescription_line2")%>
                                    </p>                                    
                                </div>
                                <div class="standaloneNotifyButton">
                                <a id="NotifyButton" class="button" runat="server"><u>Contact Administrator</u></a>
                           </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
