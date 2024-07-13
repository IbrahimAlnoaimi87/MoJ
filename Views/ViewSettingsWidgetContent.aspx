<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="ViewSettingsWidgetContent.aspx.cs" MasterPageFile="~/MasterPages/PartialPage.Master"
		 Inherits="SourceCode.Forms.Views.ViewSettingsWidgetContent" %>
<asp:Content runat="server" ContentPlaceHolderID="PartialPageContentPlaceHolder">
	<k3:PaneContainer ID="ViewSettingsWidgetContent_Container" runat="server"  PaneOrientation="Vertical" Resizable="false" Width="100%" Height="100%">
		<Panes>
			<k3:Pane runat="server">
				<Content>
					<div id="ViewSettingsWidgetContent_Content" class="scroll-wrapper">
						
					</div>
				</Content>
			</k3:Pane>
		</Panes>
	</k3:PaneContainer>
</asp:Content>
