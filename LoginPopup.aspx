<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="LoginPopup.aspx.cs" Inherits="SourceCode.Forms.LoginPopup" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
	<title></title>
</head>
<body>
	<form id="form1" runat="server">
		<div class="SignInForm">
			<div id="divCredentialsRequiredReason" class="credentialsRequiredReason">
			</div>
			<k3:FormField ID="UsernameField" runat="server" For="UserName" Required="true" Text='<%$ Code: String.Concat(Resources.CommonLabels.UserNameText, ":") %>'>
				<k3:Textbox ID="UserName" runat="server" Required="true" Name="UserName" Watermark='<%$ Resources: CommonLabels, UserNameWatermark %>' Description='<%$ Resources: CommonLabels, UserNameTooltipGeneric %>'/>
			</k3:FormField>
			<k3:FormField ID="PasswordField" runat="server" For="Password" Required="true" Text='<%$ Code: String.Concat(Resources.CommonLabels.PasswordText, ":") %>'>
				<k3:Password ID="Password" runat="server" Required="true" Name="Password" Watermark='<%$ Resources: CommonLabels, PasswordWatermark %>' Description='<%$ Resources: CommonLabels, PasswordTooltip %>' />
			</k3:FormField>
			<k3:FormField ID="ExtraDataField" runat="server" For="ExtraData" Required="false" Text='<%$ Code: String.Concat(Resources.CommonLabels.CredentialsExtraDataLabelDefault, ":") %>'>
				<k3:Textbox ID="ExtraData" runat="server" Required="false" Name="ExtraData" Watermark='<%$ Resources: CommonLabels, CredentialsExtraDataLabelDefault %>' Description='<%$ Resources: CommonLabels, CredentialsExtraDataLabelDefault %>'/>
			</k3:FormField>
			<k3:FormField ID="CacheCredentialsField" runat="server" For="CacheCredentials" Required="false" Text='<%$ Code: String.Concat(Resources.CommonLabels.CacheCredentialsText, ":") %>'>
				<k3:Checkbox ID="CacheCredentials" runat="server" Name="CacheCredentials" Value="false" Checked="false" Description="<%$ Resources: CommonLabels, CacheCredentialsText %>"  />
			</k3:FormField>
			
			<div class="loginButtonWrapper">
				<k3:Button ID="SignInButton" ButtonID="SignInButton" runat="server" Text="<%$ Resources: CommonActions, LogInText %>" Title="<%$ Resources: CommonActions, LogInText %>" />
			</div>
		</div>
	</form>
</body>
</html>
