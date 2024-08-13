<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="UserAvatar.ascx.cs" Inherits="SourceCode.Forms.UserControls.UserAvatar" %>


<div runat="server" id="MainControl" ClientIDMode="Static" class="avatar-control">
    <a class="lyt-avatar-content avatar-button">
        <span id="AvatarName" class="avatar-name" runat="server"></span>
        <span id="AvatarImageSmall" ClientIDMode="Static" runat="server" class="avatar-icon icon icon-size16 ic-avatarempty"></span>
    </a>
</div>
 <div id="PopupContent" class="avatar-popup" style="display:none;">

        <span id="AvatarImageLarge" class="icon icon-size64 ic-avatarempty" ></span>
        <div class="lyt-avatar-text">
            <span id="LblDisplayName" class="name" runat="server"></span>
            <span id="LblEmail" class="email" runat="server"></span>
         </div>
        
        <k3:Button runat="server" ClientIDMode="Static" id="EmailLink"></k3:Button>
        <k3:Button runat="server" id="LogoutLink" ButtonStyle="primary"></k3:Button>
        
    </div>