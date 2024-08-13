<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" Inherits="SourceCode.Forms.Runtime.Default" EnableViewState="false" %>

<!DOCTYPE html>

<html dir="<%=GetGlobalResourceObject("Default", "HTMLDirectionality") %>">
<head runat="server">
	<title></title>
	<link href="<%= Page.ResolveUrl("~/Runtime/Styles/Platinum/CSS/appruntime.css")%>" rel="stylesheet" type="text/css" />
</head>
<body>
	<form id="form1" runat="server" behavior="FullSize">
	<div class="outer-body">
		<img src="<%= Page.ResolveUrl("~/Styles/Platinum2/Images/Icons/DesignerHome/K2Logo70.png")%>" alt="Logo" />
		<div class="runtime-pane">
			<img src="<%= Page.ResolveUrl("~/Runtime/Styles/Platinum/Images/SFLogo.png")%>" alt="Logo" />
			<div class="content-container">
				<%=GetLocalResourceObject("RuntimeHomeText").ToString()%>
			</div>
		</div>
	</div>
	</form>
</body>
</html>
