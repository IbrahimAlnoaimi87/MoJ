<%@ Page Language="C#" AutoEventWireup="true"  CodeBehind="K2DesignerForForms.aspx.cs" Inherits="SourceCode.Forms.K2DesignerForForms" %>

<!DOCTYPE html>

<html dir="<%=GetGlobalResourceObject("Default", "HTMLDirectionality") %>" data-ng-app="K2DesignerApp">
<head>
    <title>Nintex Designer for Forms</title>
</head>
<body style="margin: 0px 0px 0px 0px; top: 0px; left: 0px; right: 0px; bottom: 0px">
    <script type="text/javascript">
        var sfDesigners = null;
        // wrap in a try-catch for the case of cross-origin request. (Sharepoint)
        try
        {
            if (!!window.top &&
                !!window.top.SourceCode &&
                !!window.top.SourceCode.Forms &&
                !!window.top.SourceCode.Forms.Designers &&
                !!window.top.SourceCode.Forms.Designers.Workflow &&
                !!window.top.SourceCode.Forms.Designers.Workflow.notifyPageLoaded)
            {
                sfDesigners = window.top.SourceCode.Forms.Designers;
            }	
        }
        catch (ex) {}

        window.onload = function ()
        {
        };
    
        //Legacy Window Method Used by Silverlight Designer.
        function ShowHide()
        {
            throw "Showhide - this method is deprecated and should be removed.";
        }

        //Legacy Window Method Used by Silverlight Designer.
        function DoResize()
        {
            throw "DoResize - this method is deprecated and should be removed.";
        }

        //Legacy Window Method Used by Silverlight Designer.
        function SetProcessName(ProcessName)
        {
            //We don't need to update the process name as the file tab should be hidden when editing legacy workflow
            //sfDesigners.Workflow.notifyWorkflowNameChanged(ProcessName);
        }

        //Legacy Window Method Used by Silverlight Designer.
        function DeployedSuccessfully(ProcessId, CategoryId)
        {
            sfDesigners.Workflow.notifyWorkflowDeployed(CategoryId, ProcessId);
        }

        //Legacy Window Method Used by Silverlight Designer.
        function ProcessSaved(ProcessId, CategoryId)
        {
            sfDesigners.Workflow.notifyWorkflowSaved(CategoryId, ProcessId);
        }

        //Legacy Window Method Used by Silverlight Designer.
        function ProcessDeleted(ProcessId, CategoryId)
        {
            sfDesigners.Workflow.notifyWorkflowDeleted(CategoryId, ProcessId);
        }

        //Legacy Window Method Used by Silverlight Designer.
        function MaximizeMinimize()
        {
            throw "K2DesignerFormForms.aspx - MaxmizeMinimize is deprecated and should be removed.";
        }
    </script>
    <table id="DesignerContentTable" style="height: 100%; width: 100%;" cellpadding="0" cellspacing="0">
        <tr valign="top" style="height: 100%">
            <td>
                <iframe id="IframeK2D4SF" runat="server" scrolling="no" frameborder="0" style="position: absolute; top: 0px; bottom: 0px; left: 0px; right: 0px; width: 100%; height: 100%;"></iframe>
            </td>
        </tr>
    </table>
</body>
</html>
