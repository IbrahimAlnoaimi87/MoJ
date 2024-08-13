<%@ Page Language="C#" AutoEventWireup="true" MasterPageFile="~/MasterPages/PartialPage.Master"  CodeBehind="RuntimeFilterOrder.aspx.cs" Inherits="SourceCode.Forms.Rules.RuntimeFilterOrder" %>
<asp:Content ID="Content1" ContentPlaceHolderID="PartialPageContentPlaceHolder" runat="server">
<k3:PaneContainer ID="FilterPaneContainer" runat="server" PaneOrientation="Vertical" Resizable="false">
		<Panes>
			<k3:Pane ID="FilterTopPane" runat="server" AutoSize="True" Resizable="False">
				<Content>
					<k3:Panel CssClass="WorkFlowItemMappings" runat="server" Behavior="Fluid">
						<Header><asp:Literal runat="server" ID="headerText" OnLoad="UpdateLiteralText" /></Header>
						<Content>
							<k3:FormField ID="FilterNameField" Text="<%$ Resources:FilterName %>" Required="true" runat="server" For="FilterName">
								<k3:Textbox Required="true" ID="FilterName" runat="server" Watermark="<%$ Resources: NewFilterNameWatermarkText %>" />
							</k3:FormField>
						</Content>
					</k3:Panel>
				</Content>
			</k3:Pane>
			<k3:Pane ID="FilterBottomPane" runat="server" Resizable="False">
				<Content>
					<k3:TabBox ID="FilterTabBox" runat="server" AlignTabs="top" Behavior="Fullsize">
						<k3:Tabs ID="FilterTabs" runat="server">
							<k3:Tab ID="FilterTab" runat="server" Icon="filter" Selected="true" Text="<%$ Resources: FilterTabText %>"/>
							<k3:Tab ID="OrderTab" runat="server" Icon="ordering" Selected="false" Text="<%$ Resources: OrderTabText %>"/>
						</k3:Tabs>
						<k3:TabBody ID="FilterTabBoxTabBody" runat="server">
							<k3:TabContent ID="FilterTabBoxTabsContent" runat="server">
								<div id="FilterTab_Content" class="scroll-wrapper"></div>
								<div id="OrderTab_Content" class="scroll-wrapper" style="display: none;"></div>
							</k3:TabContent>
						</k3:TabBody>
					</k3:TabBox>
				</Content>
			</k3:Pane>
		</Panes>
	</k3:PaneContainer>
</asp:Content>
