<%@ Page Title="" Language="C#" MasterPageFile="~/MasterPages/Home.master" AutoEventWireup="true" CodeBehind="Logout.aspx.cs" Inherits="SourceCode.Forms.Logout" %>
<asp:Content ID="Content1" ContentPlaceHolderID="MainHeaderContentPlaceholder" runat="server"><asp:PlaceHolder ID="LoginStatus" runat="server" /></asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="SystemInfoContentPlaceHolder" runat="server"><%=GetGlobalResourceObject("CommonPhrases", "PoweredByText") %></asp:Content>
<asp:Content ID="Content3" ContentPlaceHolderID="HomeContentPlaceHolder" runat="server">
</asp:Content>
<asp:Content ID="Content4" ContentPlaceHolderID="LocalVariables" runat="server">
</asp:Content>
