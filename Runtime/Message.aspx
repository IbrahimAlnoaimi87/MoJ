<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Message.aspx.cs" Inherits="SourceCode.Forms.Runtime.Message" EnableViewState="false" EnableViewStateMac="false" %>

<!DOCTYPE html>

<html dir="<%=GetGlobalResourceObject("Default", "HTMLDirectionality") %>">
<head runat="server">
	<title>Message</title>
</head>
<body class="theme-entry" >
	<form id="form1" runat="server">
	<div class="panel full scroll-contents without-header without-toolbar without-footer">
		<div class="panel-body">
			<div class="panel-body-t">
				<div class="panel-body-t-l">
				</div>
				<div class="panel-body-t-c">
				</div>
				<div class="panel-body-t-r">
				</div>
			</div>
			<div class="panel-body-m">
				<div class="panel-body-m-l">
				</div>
				<div class="panel-body-m-c">
					<div class="panel-body-wrapper">
						<div class="scroll-wrapper">
							<div class="intro-content appstudio" style="left:0px;right:0px;bottom:0px;top:0px;" >
							<br />
								<h1 runat="server" id="MessageHeading" >
								</h1>
								<br />
								<div runat="server" id="MessageBody" >
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="panel-body-m-r">
				</div>
			</div>
			<div class="panel-body-b">
				<div class="panel-body-b-l">
				</div>
				<div class="panel-body-b-c">
				</div>
				<div class="panel-body-b-r">
				</div>
			</div>
		</div>
	</div>
	</form>
	<iframe id="HiddenFileFrame" name="HiddenFileFrame"></iframe>
</body>
</html>
