<%@ Page Title="" Language="C#" MasterPageFile="~/MasterPages/Generic.master" AutoEventWireup="true" CodeBehind="Session.aspx.cs" Inherits="SourceCode.Forms.Session" %>

<asp:Content ID="Content1" ContentPlaceHolderID="PageContent" runat="server">
	<script type="text/javascript">
		function returnDialogValue()
		{
			if (window.location.href.toLowerCase().indexOf("_mobilesession=1") > 0)
			{
				// Send mobileApp to about.blank so that mobile will close the window 
				window.location.href = "about:blank";
				return;
			}
			try
			{
				if (window.opener)
				{
					window.opener.returnValue = true;
				}
				window.returnValue = true;
				window.close();
			}
			catch (e)
			{
				
			}
			finally
			{
				forcedClose();
			}
		}

		function forcedClose()
		{
			try
			{
				window.open('', (SourceCode.Forms.Browser.msie && SourceCode.Forms.Browser.version >= 7 ? '_parent' : '_self'), '');
				window.close();
			}
			catch (e)
			{
				try
				{
					this.focus();
					self.opener = this;
					self.close();
				}
				catch (e)
				{

				}
			}
		}

		$(document).ready(function ()
		{
			$(".pane-container").children().first().css({ "bottom": "28px", "top": "0px" });
			$(".pane-container").children().last().css("bottom", "0px");
			$("#CloseButton").click(returnDialogValue);
			window.setTimeout(returnDialogValue, 3000);
		});
	</script>
	<div style="position: absolute; top: 5px; left: 5px; right: 5px; bottom: 5px;">
		<k3:PaneContainer runat="server" PaneOrientation="Vertical">
			<Panes>
				<k3:Pane runat="server">
					<Content>
						<k3:Panel runat="server" Behavior="FullSize">
							<Content>
								<div class="SessionContent">
									<div class="SignInLockImage"></div>
									<div class="IntroText">
										<p class='PageHeader'><%=GetGlobalResourceObject("AppStudio", "SessionRenewedHeading")%></p>
										<p><%=GetGlobalResourceObject("AppStudio", "SessionRenewedDescription")%></p>
									</div>
								</div>
							</Content>
						</k3:Panel>
					</Content>
				</k3:Pane>
				<k3:Pane runat="server" MinHeight="25px" Height="25px" Resizable="False">
					<Content>
						<k3:ButtonBar runat="server">
							<k3:ButtonGroup runat="server" ButtonAlignment="right">
								<k3:Button ID="CloseButton" ButtonID="CloseButton" runat="server" Text="<%$ Resources: CommonActions, Close %>" />
							</k3:ButtonGroup>
						</k3:ButtonBar>
					</Content>
				</k3:Pane>
			</Panes>
		</k3:PaneContainer>

	</div>
</asp:Content>
