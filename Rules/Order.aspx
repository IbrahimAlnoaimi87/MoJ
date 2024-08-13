<%@ Page Language="C#" AutoEventWireup="true"   MasterPageFile="~/MasterPages/PartialPage.Master" CodeBehind="Order.aspx.cs" Inherits="SourceCode.Forms.Rules.Order" %>
<asp:Content ID="Content1" ContentPlaceHolderID="PartialPageContentPlaceHolder" runat="server">
	<k3:Panel ID="FilterPanel" runat="server" Behavior="FullSize">
		<Header>
			<%=(string)GetLocalResourceObject("Heading")%>
		</Header>
		<Content>
			<k3:Grid runat="server" Behavior="FullSize" ID="OrderGrid" EmptyGridMessage="<%$ Resources:EmptyGridMessage %>">
				<Columns>
					<k3:GridColumn DisplayText="<%$ Resources:SortColumn %>" Width="250" Modulus="true">
						<EditTemplate>
							<select id="sortColumnDropDown" class="input-control sort-column icon-control"></select>
						</EditTemplate>
					</k3:GridColumn>
					<k3:GridColumn DisplayText="<%$ Resources:SortOrder %>" Width="250">
						<EditTemplate>
							<select id="sortOrderDropDown" class="input-control sort-order icon-control">
								<option class="sort-ascending" value="Ascending"><%=(string)GetLocalResourceObject("Ascending")%></option>
								<option class="sort-descending" value="Descending"><%=(string)GetLocalResourceObject("Descending")%></option>
							</select>
						</EditTemplate>
					</k3:GridColumn>
				</Columns>
			</k3:Grid>
		</Content>
	</k3:Panel>
</asp:Content>
