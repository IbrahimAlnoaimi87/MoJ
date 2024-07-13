<%@ Page Language="C#" AutoEventWireup="true"  MasterPageFile="~/MasterPages/PartialPage.Master" CodeBehind="ReadOnly.aspx.cs" Inherits="SourceCode.Forms.Rules.ReadOnly" %>

<asp:content id="Content1" contentplaceholderid="PartialPageContentPlaceHolder" runat="server">
<k3:Grid runat="server" Behavior="FullSize" ID="rwReadOnlyGrid" EmptyGridMessage="" CssClass="rules-readonly-grid">
	<Columns>
		<k3:GridColumn DisplayText="<%$ Resources:lblViewFormName%>" Width="150" >
			<EditTemplate>
						
			</EditTemplate>
		</k3:GridColumn>
		<k3:GridColumn DisplayText="<%$ Resources:lblControlName%>" Width="150" Modulus="true" >
			<EditTemplate>
						
			</EditTemplate>
		</k3:GridColumn>
		<k3:GridColumn DisplayText="<%$ Resources:lblUnchanged%>" Width="150" align="center" HeaderName="header-choice">
			<EditTemplate>
						
			</EditTemplate>
		</k3:GridColumn>
		<k3:GridColumn DisplayText="<%$ Resources:lblReadOnly%>" Width="150" align="center" HeaderName="header-choice">
			<EditTemplate>
						
			</EditTemplate>
		</k3:GridColumn>
		<k3:GridColumn DisplayText="<%$ Resources:lblEditable%>" Width="150" align="center" HeaderName="header-choice">
			<EditTemplate>
						
			</EditTemplate>
		</k3:GridColumn>
		<k3:GridColumn DisplayText="<%$ Resources:lblMixed%>"  Hidden="true" Width="150" align="center">
			<EditTemplate>
						
			</EditTemplate>
		</k3:GridColumn>
	</Columns>
</k3:Grid>
</asp:content>
