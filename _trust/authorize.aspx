<%@ Page Language="C#" AutoEventWireup="true" MasterPageFile="~/MasterPages/Generic.master" Inherits="SourceCode.Security.Claims.Web._trust.authorize, SourceCode.Security.Claims.Web, Version=4.0.0.0, Culture=neutral, PublicKeyToken=16a2c5aaaa1b130d" %>

<%@ Register Assembly="SourceCode.Security.Claims.Web, Version=4.0.0.0, Culture=neutral, PublicKeyToken=16a2c5aaaa1b130d" Namespace="SourceCode.Security.Claims.Web.Controls" TagPrefix="K4" %>
<asp:Content ID="HomeContent" ContentPlaceHolderID="PageContent" runat="server">
	<K4:Panel ID="SignInPanel" runat="server" Behavior="FullSize">
		<Content>
			<div>
				<% if (Request.IsAuthenticated)	{ %>
					<p>You have been successfully authenticated.</p>
					<p>Close this window and refresh the original browser window.</p>
				<% } else { %>
					<p>The contents of this page cannot be displayed because you cannot be automatically logged in.</p>
					<p><a href="<%= AuthUrl %>" target="_blank">Login</a> in a separate window and then <a href="<%= RefreshUrl %>">refresh</a> the control.</p>
				<% } %>
			</div>
		</Content>
	</K4:Panel>
</asp:Content>
