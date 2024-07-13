<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="MOSSForm.aspx.cs" Inherits="SourceCode.Forms.Runtime.MOSSForm" %>

<!DOCTYPE html>

<html dir="<%=GetGlobalResourceObject("Default", "HTMLDirectionality") %>">
<head runat="server">
	<title>Form</title>
	<style type="text/css">
		html, body, form, iframe
		{
			height: 100%;
			margin: 0px;
			width:100%;
			overflow:hidden;
		}
	</style>
</head>
<body >
	<form id="form1" runat="server">
	<iframe runat="server" id="iframeRuntimeForm"></iframe>
	</form>
</body>
</html>
