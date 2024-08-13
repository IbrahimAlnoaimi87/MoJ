<%@ Page Title="" Language="C#" MasterPageFile="~/MasterPages/PartialPage.Master" AutoEventWireup="true" CodeBehind="FormNavigate.aspx.cs" Inherits="SourceCode.Forms.Rules.FormNavigate" %>
<asp:Content ID="Content1" ContentPlaceHolderID="PartialPageContentPlaceHolder" runat="server">
	<k3:PaneContainer ID="FormNavigatePC" runat="server" PaneOrientation="Vertical" Resizable="false">
		<Panes>
			<k3:Pane ID="FormNavigateStatePane" runat="server" Height="90px" Resizable="false">
				<Content>
					<k3:Panel ID="FormNavigateStatePanel" runat="server" Behavior="FullSize" Scrolling="false">
						<Header><%=(string)GetLocalResourceObject("FormNavigateStatePanelHeader")%></Header>
						<Content>
							<k3:FormField ID="FormNavigateStateFF" Text="<%$ Resources:FormNavigateStateLabel %>" runat="server"></k3:FormField>
							<k3:FormField ID="FormNavigateOpenInFF" Text="<%$ Resources:FormNavigateOpenInLabel %>" runat="server"></k3:FormField>
						</Content>
					</k3:Panel>
				</Content>
			</k3:Pane>
			<k3:Pane ID="FormNavigateConfigPane" runat="server" Resizable="true">
				<Content>
					<k3:Panel ID="FormNavigateConfigPanel" runat="server" Behavior="FullSize" Scrolling="true">
						<Header><%=(string)GetLocalResourceObject("FormNavigateConfigPanel")%></Header>
						<Toolbars>
							<k3:ToolbarGroup runat="server">
								<k3:Toolbar runat="server"></k3:Toolbar>
							</k3:ToolbarGroup>
						</Toolbars>
						<Content>
							<div id="FormNavigateMappingsTree" class="tree"></div>
						</Content>
					</k3:Panel>
				</Content>
			</k3:Pane>
			<k3:Pane ID="FormNavigatePreviewPane" runat="server" Height="80px" Resizable="true">
				<Content>
					<k3:Panel ID="FormNavigatePreviewPanel" runat="server" Behavior="FullSize" Scrolling="true">
						<Header><%=(string)GetLocalResourceObject("FormNavigatePreviewPanel")%></Header>
						<Content>
							<a id="FormNavigatePreviewURL" runat="server" class="preview-url" href="javascript:;" target="_blank"></a>
						</Content>
					</k3:Panel>
				</Content>
			</k3:Pane>
		</Panes>
	</k3:PaneContainer>
	<k3:HiddenField runat="server" ID="FormNavigateStateDisplays" />
	<k3:HiddenField runat="server" ID="FormNavigateStateValues" />
</asp:Content>
