<%@ Page Title="" Language="C#" MasterPageFile="~/MasterPages/PartialPage.Master"
	AutoEventWireup="true" CodeBehind="Mappings.aspx.cs" Inherits="SourceCode.Forms.Rules.Mappings" %>

<asp:Content ID="Content1" ContentPlaceHolderID="PartialPageContentPlaceHolder" runat="server">
	<k3:Wizard runat="server" ID="RuleMappingWizard" EnableStepTree="true" HideWizardButtons="true">
		<Steps>
		</Steps>
	</k3:Wizard>
</asp:Content>
