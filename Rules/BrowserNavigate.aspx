<%@ Page Title="" Language="C#" MasterPageFile="~/MasterPages/PartialPage.Master"
	AutoEventWireup="true" CodeBehind="BrowserNavigate.aspx.cs" Inherits="SourceCode.Forms.Rules.BrowserNavigate" %>

<asp:content id="Content1" contentplaceholderid="PartialPageContentPlaceHolder" runat="server">
<k3:PaneContainer ID="BrowserNavigatePC" runat="server" PaneOrientation="Vertical" Resizable="false" >
	<Panes>
		<k3:Pane ID="PaneURL" runat="server" Height="89px" Resizable="false">
			<Content>
				<k3:Panel runat="server" Behavior="FullSize" Scrolling="false">
					<Header><%=(string)GetLocalResourceObject("HeaderConfigureURL")%></Header>
					<Content>
						<%-- TODO: TD 0001 --%>
						<k3:FormField ID="BrowserNavigateBaseURLFF" Text="<%$ Resources:LabelBaseURL %>" Required="true" runat="server">
							<input type="text" id="baseURLText" class="token-input" data-options="<%=SetBaseUrlMetadata()%>" />
						</k3:FormField>
						<k3:FormField ID="BrowserNavigateOpenInFF" Text="<%$ Resources:BrowserNavigateOpenInLabel %>" runat="server">
							<div>
								<div>

								</div>
								<div>
									<k3:Button id="BrowserNavigateDialogOptionsButton" ButtonID="BrowserNavigateDialogOptionsButton" runat="server" Type="lookup" Title="<%$ Resources:DialogOptionsTooltip %>" Text="..." Disabled="True" />
								</div>
							</div>
						</k3:FormField>
						<div id="ModalDialogOptions" class="wrapper" style="display:none;">
							<k3:Panel runat="server" Behavior="FullSize" Scrolling="false">
								<Content>
									<k3:FormField Text="<%$ Resources:CommonLabels, SizeLabelText %>" runat="server" BoldLabel="True" />
									<hr />
									<k3:FormField ID="BrowserNavigateDialogWidthFF" Text="<%$ Resources:CommonLabels, WidthLabelText %>" runat="server" Visible="">
										<k3:Textbox runat="server" id="BrowserNavigateDialogWidth" Watermark="<%$ Resources: TypeOnlyWatermarkMessage %>" />
									</k3:FormField>
									<k3:FormField ID="BrowserNavigateDialogHeigthFF" Text="<%$ Resources:CommonLabels, HeightLabelText %>" runat="server">
										<k3:Textbox runat="server" id="BrowserNavigateDialogHeight" Watermark="<%$ Resources: TypeOnlyWatermarkMessage %>" />
									</k3:FormField>
									<k3:FormField ID="BrowserNavigateDialogResizableFF" Text="<%$ Resources:BrowserNavigateDialogResizableLabel %>" runat="server">
										<k3:Checkbox ID="BrowserNavigateDialogResizable" runat="server" Value="yes" Checked="True" />
									</k3:FormField>
									
									<k3:FormField Text="<%$ Resources:CommonLabels, PositionLabelText %>" runat="server" BoldLabel="True" />
									<hr />
									<k3:FormField ID="BrowserNavigateDialogCenterFF" Text="<%$ Resources:BrowserNavigateDialogCenterLabel %>" runat="server">
										<k3:Checkbox ID="BrowserNavigateDialogCenter" runat="server" Value="yes" Checked="True" />
									</k3:FormField>
									<k3:FormField ID="BrowserNavigateDialogTopFF" Text="<%$ Resources:CommonLabels, TopLabelText %>" runat="server">
										<k3:Textbox runat="server" id="BrowserNavigateDialogTop" Watermark="<%$ Resources: TypeOnlyWatermarkMessage %>" Disabled="True" />
									</k3:FormField>
									<k3:FormField ID="BrowserNavigateDialogLeftFF" Text="<%$ Resources:CommonLabels, LeftLabelText %>" runat="server">
										<k3:Textbox runat="server" id="BrowserNavigateDialogLeft" Watermark="<%$ Resources: TypeOnlyWatermarkMessage %>" Disabled="True" />
									</k3:FormField>

									<k3:FormField Text="<%$ Resources:CommonLabels, GeneralLabelText %>" runat="server" BoldLabel="True" />
									<hr />
									<k3:FormField ID="BrowserNavigateDialogStatusFF" Text="<%$ Resources:BrowserNavigateDialogStatusLabel %>" runat="server">
										<k3:Checkbox ID="BrowserNavigateDialogStatus" runat="server" Value="yes" Checked="True" />
									</k3:FormField>
								</Content>
							</k3:Panel>
						</div>
					</Content>
				</k3:Panel>
			</Content>
		</k3:Pane>
		<k3:Pane ID="PaneGrid" runat="server">
			<Content>
				<k3:Grid runat="server" Behavior="FullSize" ID="URLParameters" ActionLinkMessage="<%$ Resources: LabelActionLink %>">
					<Header><%=(string)GetLocalResourceObject("HeaderConfigureParameters")%></Header>
					<Toolbars>
						<k3:ToolbarGroup ID="URLParametersToolbarGroup" runat="server">
							<k3:Toolbar runat="server" ID="URLParametersToolbar">
								<k3:ToolbarButton ButtonClass="add" ID="URLParametersAddPropertyButton" Text="<%$ Resources:CommonActions,AddText%>" Description="<%$ Resources:TooltipAdd %>" runat="server" />
								<k3:ToolbarDivider ID="ToolbarDivider1" runat="server" />
								<k3:ToolbarButton ButtonClass="edit" Disabled="true" ID="URLParametersEditPropertyButton" Text="<%$ Resources:CommonActions,EditText%>" Description="<%$ Resources:TooltipEdit %>" runat="server" />
								<k3:ToolbarDivider ID="ToolbarDivider2" runat="server" />
								<k3:ToolbarButton ButtonClass="remove" Disabled="true" ID="URLParametersRemovePropertyButton" Text="<%$ Resources:CommonActions,RemoveText%>" Description="<%$ Resources:TooltipRemove %>" runat="server" />
								<k3:ToolbarDivider ID="ToolbarDivider3" runat="server" />
								<k3:ToolbarButton ButtonClass="remove-all" Disabled="true" ID="URLParametersRemoveAllPropertiesButton" Text="<%$ Resources:CommonActions,RemoveAllText%>" Description="<%$ Resources:TooltipRemoveAll %>" runat="server" />
								</k3:Toolbar>
						</k3:ToolbarGroup>
					</Toolbars>
					<Columns>
						<k3:GridColumn runat="server" DisplayText="<%$ Resources:CommonLabels,NameLabelText%>" Name="prop-name" Width="190px">
							<EditTemplate>
								<k3:Textbox ID="ParamName" runat="server" Value="" />
							</EditTemplate>
						</k3:GridColumn>
						<k3:GridColumn runat="server" DisplayText="<%$ Resources:CommonLabels,DefaultLabelText%>" Name="prop-desc" >
							<EditTemplate>
								<%-- TODO: TD 0001 --%>
								<div class="textbox-container">
									<input type="text" id="ParamValue" class="token-input" data-options="<%=SetParamMetadata()%>" />
								</div>
							</EditTemplate>
						</k3:GridColumn>
					</Columns>
				</k3:Grid>
			</Content>
		</k3:Pane>
		<k3:Pane ID="PanePreview" runat="server" MinHeight="20px" Height="80px" Resizable="true">
			<Content>
				<k3:Panel ID="FormNavigatePreviewPanel" runat="server" Behavior="FullSize" >
					<Header><%=(string)GetLocalResourceObject("HeaderPreview")%></Header>
					<Content>
						<a id="FormNavigatePreviewURL" runat="server" class="preview-url" href="javascript:;" target="_blank"></a>
					</Content>
				</k3:Panel>
			</Content>
		</k3:Pane>
	</Panes>
</k3:PaneContainer>
</asp:content>
