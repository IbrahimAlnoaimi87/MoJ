<%@ Page Language="C#" AutoEventWireup="true"   MasterPageFile="~/MasterPages/PartialPage.Master" CodeBehind="Filter.aspx.cs" Inherits="SourceCode.Forms.Rules.Filter" %>
<asp:Content ID="Content1" ContentPlaceHolderID="PartialPageContentPlaceHolder" runat="server">
<k3:Panel ID="FilterPanel" runat="server" Behavior="FullSize">
	<Header>
			<%=(string)GetLocalResourceObject("Heading")%>
	</Header>
	<Content>
		<div style="display:none;height:100%" id="advancedFilterPreview"></div>
		<k3:Grid runat="server" Behavior="FullSize" ID="simpleFilterGrid" EmptyGridMessage="<%$ Resources:EmptyGridMessage %>">
			<Columns>
				<k3:GridColumn DisplayText="<%$ Resources:Field %>" Width="150px">
					<EditTemplate>
						<select class="input-control field icon-control filterTemplateFieldDropDown"></select>
					</EditTemplate>
				</k3:GridColumn>
				<k3:GridColumn DisplayText="<%$ Resources:Operator %>" Width="150px" >
					<EditTemplate>
						<select id="operatorDropDown" class="input-control operator icon-control">
							<option class="equals" value="Equals"><%=(string)GetLocalResourceObject("Equals")%></option>
							<option class="not-equals" value="NotEquals"><%=(string)GetLocalResourceObject("NotEquals")%></option>
							<option class="greater-than" value="GreaterThan"><%=(string)GetLocalResourceObject("GreaterThan")%></option>
							<option class="less-than" value="LessThan"><%=(string)GetLocalResourceObject("LessThan")%></option>
							<option class="greater-than-equals" value="GreaterThanEquals"><%=(string)GetLocalResourceObject("GreaterThanEquals")%></option>
							<option class="less-than-equals" value="LessThanEquals"><%=(string)GetLocalResourceObject("LessThanEquals")%></option>
							<option class="contains" value="Contains"><%=(string)GetLocalResourceObject("Contains")%></option>
							<option class="starts-with" value="StartsWith"><%=(string)GetLocalResourceObject("StartsWith")%></option>
							<option class="ends-with" value="EndsWith"><%=(string)GetLocalResourceObject("EndsWith")%></option>
							<option class="text-blank" value="IsBlank"><%=(string)GetLocalResourceObject("IsBlank")%></option>
							<option class="text-not-blank" value="IsNotBlank"><%=(string)GetLocalResourceObject("IsNotBlank")%></option>
						</select>
					</EditTemplate>
				</k3:GridColumn>
				<k3:GridColumn DisplayText="<%$ Resources:Value %>" Width="150px" Modulus="true">
					<EditTemplate>
						<input type="text" id="valueTextBox" class="input-control value token-input" />
					</EditTemplate>
				</k3:GridColumn>
			</Columns>
		</k3:Grid>
	</Content>
</k3:Panel>
</asp:Content>
