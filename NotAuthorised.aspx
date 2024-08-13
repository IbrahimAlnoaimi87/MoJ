<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="NotAuthorised.aspx.cs" Inherits="SourceCode.Forms.NotAuthorised" %>

<!DOCTYPE html>

<html dir="<%=GetGlobalResourceObject("Default", "HTMLDirectionality") %>">
<head id="Head1" runat="server">
	<title></title>
	<link href="<%= Page.ResolveUrl("~/Styles/Platinum2/CSS/notauthorised.css")%>" rel="stylesheet" type="text/css" />
</head>
<body class="notauthorised-body">
	<form id="form1" runat="server" behavior="FullSize">
		<div class="notauthorised-outer-panel">
			<div class="notauthorised-left-panel"></div>
			<div class="notauthorised-middle-panel">
				<div class="notauthorised-k2-smartforms-logo">
					<img src="<%= Page.ResolveUrl("~/Styles/Platinum2/Images/Icons/Management/K2LogoPermissions64.png")%>" alt="Permissions logo" />
				</div>
				<div class="not-authorised-heading">
					<%=GetLocalResourceObject("NotAuthorisedHeading").ToString()%>
				</div>
				<div class="not-authorised-text">
					<%=GetLocalResourceObject("NotAuthorisedText").ToString()%>
				</div>
				<div class="notauthorised-help-text">
					<%=GetLocalResourceObject("NotAuthorisedHelpText").ToString()%>
				</div>				
			</div>
			<div class="notauthorised-right-panel"></div>
		</div>
	</form>
</body>
</html>
