<%@ Page Title="" Language="C#" MasterPageFile="~/MasterPages/PartialPage.Master"
    AutoEventWireup="true" CodeBehind="PartialPage.aspx.cs" Inherits="SourceCode.Forms.Views.PartialPage" %>

<asp:Content ID="Content1" ContentPlaceHolderID="PartialPageContentPlaceHolder" runat="server">
    <k3:Wizard runat="server" ID="ViewWizard" WizardStyle="Tabs" EnableStepTree="true" HideWizardButtons="true" TopWizardButtons="true"
        HeaderFormat="<%$ Resources:WizardHeader %>" ShowSaveButton="true">
        <Steps>
            <k3:WizardStep ID="DetailsStep" runat="server">
                <StepContent>
                    <div id="ViewDesignerDetailsPanel" class="lyt-centered scroll-wrapper designer-configpanel">
                        <div class="lyt-centered-container-outer">
                            <div class="lyt-centered-container-inner">
                                <div class="lyt-centered-container">
                                    <div>
                                        <div class="field-page-header">
                                            <div class="field-page-icon"></div>
                                        </div>
                                        <k3:FormField ID="FormField1" runat="server" Required="true" Text="<%$ Resources:ViewName%>"
                                            For="vdtxtViewName">
                                            <k3:Textbox ID='vdtxtViewName' Watermark="<%$Resources: Wizard, ObjectNameWatermarkTextSmartViewSingular%>"
                                                Required='true' runat="server">
                                            </k3:Textbox>
                                            <input type="hidden" id="vdViewSystemName" />
                                        </k3:FormField>
                                        <k3:FormField ID="FormField2" runat="server" Required="false" Text="<%$ Resources:ViewDescription%>"
                                            For="vdtxtViewDescription">
                                            <k3:TextArea ID='vdtxtViewDescription' Watermark="<%$Resources: Wizard, ObjectDescriptionWatermarkTextSmartViewSingular%>"
                                                Required="false" runat="server">
                                            </k3:TextArea>
                                        </k3:FormField>
                                        <k3:FormField ID="FormField8" Required="true" runat="server" Text="<%$ Resources:ContentCategoryHeader%>">
                                            <k3:CategoryLookup runat="server" ID="ViewDesignerCategoryLookup" ControlID="ViewDesignerCategoryLookup"
                                                Watermark="<%$Resources: Wizard, ObjectSelectDragWatermarkTextCategoryIndefiniteSingular%>"
                                                ObjectTypes="category" />
                                            <input type="hidden" id="smocategoryId" />
                                            <input type="hidden" id="smocategoryPath" />
                                            <input type="hidden" id="viewcategoryId" />
                                            <input type="hidden" id="viewcategoryPath" />
                                        </k3:FormField>
                                        <div style="height: 20px"></div>
                                        <k3:FormField ID="FormField3" runat="server" Text="<%$ Resources:SelectViewTypeHeader%>"
                                            AlternateCssClass="override-top-margin">
                                            <k3:OptionSelectBox ID="step1Panel" runat="server" Collapsed="false">
                                                <k3:OptionSelect ID="aSelectType_Capture" Label="<%$ Resources:CaptureViewHeader %>"
                                                    Description="<%$ Resources:CaptureViewDescription %>" Checked="true" OptionClass="item-view"
                                                    runat="server" Visible="true" />
                                                <k3:OptionSelect ID="aSelectType_CaptureList" Label="<%$ Resources:ListViewHeader %>"
                                                    Description="<%$ Resources:ListViewDescription %>" Checked="false" OptionClass="capture-list"
                                                    runat="server" Visible="true" />
                                            </k3:OptionSelectBox>
                                        </k3:FormField>
                                        <div style="height: 20px"></div>
                                        <k3:FormField ID="FormField5" runat="server" Required="true" Text="<%$ Resources:DataSourceLabel %>">
                                            <k3:CategoryLookup ID="ViewDesignerSmartObjectLookup" ControlID="ViewDesignerSmartObjectLookup"
                                                Watermark="<%$Resources: Wizard, ObjectSelectDragWatermarkTextSmartObjectIndefiniteSingular%>"
                                                ValidationMessage="<%$ Resources:ViewDesigner,ValidationSmartObjectNotSelected %>"
                                                Required="true" ObjectTypes="smartobject" runat="server" />
                                            <input type="hidden" id="vdsmartObjectID" />
                                        </k3:FormField>
                                        <k3:FormField ID="ListViewGeneralStepMethodControlsDisabled" AlternateCssClass="hidden" runat="server" Text="<%$ Resources:ListViewGetListMethod%>" For="listViewGetListMethod">
                                            <div class="ListViewGeneralStepMethodControlsDisabled"><%=GetLocalResourceObject("ListViewGeneralStepMethodControlsDisabled")%></div>
                                        </k3:FormField>
                                        <k3:FormField ID="vdlbl_listViewGetListMethod" runat="server" Required="true" Text="<%$ Resources:ListViewGetListMethod%>" For="listViewGetListMethod">
                                            <select id="vdlistViewGetListMethod" class="input-control"></select>
                                        </k3:FormField>
                                        <k3:FormField ID="chkRefreshList" runat="server">
                                            <k3:Checkbox runat="server" ID="vdrefreshListChkbox" Checked="true" Label="<%$ Resources:CallMethodWhenFormLoadsChk%>" />
                                        </k3:FormField>
                                        <div class="field-page-buttons">
                                            <k3:Button ID="btnCreateForm" ButtonStyle="Primary" ButtonID="CreateForm" runat="server" Type="create" Text="<%$ Resources:AppStudio, CreateFormButtonText %>" Title="<%$ Resources:AppStudio, CreateFormButtonText %>" />
                                            <k3:Button ID="Button1" ButtonStyle="Secondary" ButtonID="DiscardFile" runat="server" Text="<%$ Resources:AppStudio, DiscardFormButtonText %>" Title="<%$ Resources:AppStudio, DiscardFormButtonText %>" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </StepContent>
            </k3:WizardStep>

            <k3:WizardStep ID="LayoutStep" runat="server">
                <StepContent>
                    <k3:PaneContainer ID="LayoutPaneContainer" runat="server" PaneOrientation="Horizontal" CssClass="designer-panecontainer">
                        <Panes>
                            <k3:Pane runat="server" ID="vdToolboxPane" MinWidth="135px" Width="300px" CssClass="designer-configpanel">
                                <Content>
                                    <div class="lyt-tab-container">
                                        <k3:TabBox ID="TabBox1" runat="server" AlignTabs="top" Behavior="Fullsize">
                                            <k3:Tabs ID="Tabs1" runat="server">
                                                <k3:Tab ID="ViewEditorControlToolboxTab" runat="server" Icon="controls-closed" Selected="false"
                                                    Text="<%$ Resources:TabControls %>">
                                                </k3:Tab>
                                                <k3:Tab ID="ViewEditorControlFieldsTab" runat="server" Icon="fields" Selected="true"
                                                    Text="<%$ Resources:TabControlsFields %>">
                                                </k3:Tab>
                                                <k3:Tab ID="ViewEditorControlMethodsTab" runat="server" Icon="so-methods" Selected="false"
                                                    Text="<%$ Resources:TabControlsMethods %>">
                                                </k3:Tab>
                                            </k3:Tabs>
                                            <k3:TabBody ID="TabBody1" runat="server">
                                                <k3:TabContent ID="ViewEditorControlTabsContent" runat="server">
                                                    <div class="absoluteFullWrapperOverflow">
                                                        <div id="vdFieldsList" class="visible"></div>
                                                        <div id="vdMethodsList" style="display: none;"></div>
                                                        <div id="vdToolboxList" style="display: none;"></div>
                                                        <div id="vdLayoutList" style="display: none;"></div>
                                                    </div>
                                                </k3:TabContent>
                                            </k3:TabBody>
                                        </k3:TabBox>
                                    </div>
                                </Content>
                            </k3:Pane>
                            <k3:Pane runat="server" ID="editorCanvasPane" CssClass="empty">
                                <Content>
                                    <div id="EditorCanvas" runat="server" class="view-layout-pane empty">
                                        <div class="toolbar-container">
                                            <k3:ToolbarGroup ID="vdViewEditorToolbarGroup" runat="server">
                                                <k3:Toolbar runat="server" ID="vdViewEditorToolbar">
                                                </k3:Toolbar>
                                            </k3:ToolbarGroup>
                                        </div>
                                        <div class="canvas-container">
                                            <div class="scroll-wrapper">

                                                <%-- A Table layout is needed for ie11 to center vertically and horizontally the view canvas, and allow scrolling\
                                                             As ie11 doesn't support a flex approach for this, as the scrolling and positioning breaks --%>
                                                <div class="canvas-layout-table">
                                                    <div class="tr">
                                                        <div class="td">
                                                            <div class="padding-wrapper">
                                                                <div id="ViewEditorCanvas" class="editor-canvas theme-entry empty" runat="server">
                                                                    <div id="ViewID">
                                                                        <div id="toolbarSection" class="section"></div>
                                                                        <div id="bodySection" class="section empty"></div>
                                                                        <div id="editableSection" class="section"></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </div>
                                </Content>
                            </k3:Pane>
                            <k3:Pane runat="server" ID="vdeditorToolboxPane" MinWidth="135px" Width="300px" CssClass="designer-configpanel">
                                <Content>

                                    <k3:Panel ID="edtiorBottomPanel" runat="server" Behavior="FullSize" Scrolling="false">
                                        <Content>
                                            <div class="lyt-tab-container">
                                                <div class="lyt-properties-panel">
                                                    <div class="lyt-properties-header">
                                                        <div id="ControlPropertiesIcon" class="icon ic-view icon-size32"></div>
                                                        <label id="ControlPropertiesName" class=""></label>
                                                    </div>
                                                    <div class="lyt-properties-content">
                                                        <k3:TabBox ID="TabBox2" runat="server" AlignTabs="top" Behavior="Fullsize">
                                                            <k3:Tabs ID="Tabs2" runat="server">
                                                                <k3:Tab ID="vdColumnTabPropertiesTab" Icon="properties" runat="server" Selected="true"
                                                                    Text="<%$ Resources:TabColumnProperties %>">
                                                                </k3:Tab>
                                                                <k3:Tab ID="vdControlTabPropertiesTab" Icon="properties" runat="server" Selected="true"
                                                                    Text="<%$ Resources:TabControlProperties %>">
                                                                </k3:Tab>
                                                                <k3:Tab ID="vdBodyTabPropertiesTab" Icon="properties" runat="server" Selected="true"
                                                                    Text="<%$ Resources:TabBodyProperties %>">
                                                                </k3:Tab>
                                                                <k3:Tab ID="vdViewEditorFormsTab" Icon="events" runat="server" Selected="false" Text="<%$ Resources:TabView %>">
                                                                </k3:Tab>
                                                            </k3:Tabs>
                                                            <k3:TabBody ID="ControlTabsBody" runat="server">
                                                                <k3:TabContent ID="ControlTabsContent" runat="server" Visible="true">
                                                                    <div class="absoluteFullWrapper">
                                                                        <!-- Properties Grid goes here -->
                                                                        <div id="divControlTabsContentProperties" class="wrapper">
                                                                            <div id="controlPropertiesListTable" class="scroll-wrapper"></div>
                                                                        </div>
                                                                        <!-- Deprecated Events Tree goes here -->
                                                                        <div id="divFormsTabContent" class="wrapper" style="display: none;">
                                                                            <div style="display: none;">
                                                                                <k3:ToolbarGroup ID="FormEventsTabToolbarGroup" runat="server">
                                                                                    <k3:Toolbar ID="FormEventsTabToolbar" runat="server">
                                                                                        <k3:ToolbarButton ID="vdtoolFormEventsTabAdd" runat="server" Text="<%$ Resources:Add %>"
                                                                                            ButtonClass="add" />
                                                                                        <k3:ToolbarButton ID="vdtoolFormEventsTabEdit" runat="server" Text="<%$ Resources:Edit %>"
                                                                                            ButtonClass="edit" Disabled="true" />
                                                                                        <k3:ToolbarButton ID="vdtoolFormEventsTabDelete" runat="server" Text="<%$ Resources:Delete %>"
                                                                                            ButtonClass="delete" Disabled="true" />
                                                                                    </k3:Toolbar>
                                                                                </k3:ToolbarGroup>
                                                                                <div class="contentBelowToolbar">
                                                                                    <div id="vdcontrolFormEventsActionsTree" class="absoluteFullWrapperOverflow"></div>
                                                                                </div>
                                                                            </div>
                                                                            <!-- Replacement Tabbed Rules Grid goes here -->
                                                                            <k3:Grid ID="vdFormEventsTabGrid" runat="server" Behavior="FullSize" ActionLinkMessage="<%$ Resources:ViewDesigner, RulesGridActionRowText %>">
                                                                                <toolbars>
                                                                            <k3:ToolbarGroup runat="server">
                                                                                <k3:Toolbar runat="server">
                                                                                    <k3:ToolbarButton ButtonClass="add" Text="<%$ Resources:AddViewAction %>" runat="server" />
                                                                                    <k3:ToolbarDivider ID="ToolbarDivider1" runat="server" />
                                                                                    <k3:ToolbarButton ButtonClass="edit" Text="<%$ Resources:EditViewAction %>" runat="server" Disabled="true" />
                                                                                    <k3:ToolbarDivider ID="ToolbarDivider2" runat="server" />
                                                                                    <k3:ToolbarButton ButtonClass="delete" Text="<%$ Resources:DeleteViewAction %>" runat="server" Disabled="true" />
                                                                                    <k3:ToolbarDivider runat="server" ID="vdRuleLayoutEnabledDivider" IsVisible="false" />
                                                                                    <k3:ToolbarButton ButtonClass="enable-view-rule" IsVisible="false" ID="vdToolLayoutEnableRule" Text="<%$ Resources:CommonLabels,EnableRuleText%>" runat="server" Disabled="true" />
                                                                                    <k3:ToolbarButton ButtonClass="disable-view-rule" IsVisible="false" ID="vdToolLayoutDisableRule" Text="<%$ Resources:CommonLabels,DisableRuleText%>" runat="server" Disabled="true" />
                                                                                </k3:Toolbar>
                                                                            </k3:ToolbarGroup>
                                                                        </toolbars>
                                                                        <columns>
                                                                            <k3:GridColumn runat="server" DisplayText="ID" Name="view-rule-id" Hidden="true" Sortable="false" />
                                                                            <k3:GridColumn runat="server" DisplayText="<%$ Resources:ViewActionColumnName %>" Name="view-rule-name" Sortable="true" Width="100%" />
                                                                            <k3:GridColumn runat="server" DisplayText="<%$ Resources:ViewActionColumnLocation %>" Name="view-rule-location" Hidden="true" />
                                                                            <k3:GridColumn runat="server" DisplayText="IsReference" Name="view-rule-reference" Hidden="true" Sortable="false" />
                                                                        </columns>
                                                                    </k3:Grid>
                                                                        </div>
                                                                    </div>
                                                                </k3:TabContent>
                                                            </k3:TabBody>
                                                        </k3:TabBox>
                                                    </div>
                                                </div>
                                            </div>
                                        </Content>
                                    </k3:Panel>

                                </Content>
                            </k3:Pane>
                        </Panes>
                    </k3:PaneContainer>
                </StepContent>
            </k3:WizardStep>

            <k3:WizardStep ID="ParametersStep" runat="server" StepName="<%$ Resources: ViewDesigner, ParameterStep %>">
                <StepContent>
                    <k3:Grid ID="ParametersGrid" runat="server" Behavior="FullSize" ActionLinkMessage="(Click here to add a parameter)" CssClass="designer-configpanel">
                        <Toolbars>
                            <k3:ToolbarGroup ID="ParametersToolbarGroup" runat="server">
                                <k3:Toolbar ID="ParametersToolbar" runat="server">
                                    <k3:ToolbarButton ButtonClass="add" ID="toolAddParameter" Text="Add Parameter" runat="server" />
                                    <k3:ToolbarButton ButtonClass="edit" ID="toolEditParameter" Text="Edit Parameter" runat="server" Disabled="true" />
                                    <k3:ToolbarButton ButtonClass="delete" ID="toolRemoveParameter" Text="Remove Parameter" runat="server" Disabled="true" />
                                </k3:Toolbar>
                            </k3:ToolbarGroup>
                        </Toolbars>
                        <Columns>
                            <k3:GridColumn runat="server" DisplayText="Name" Sortable="true" Width="50%" />
                            <k3:GridColumn runat="server" DisplayText="Data Type" Sortable="true" Width="10%" />
                            <k3:GridColumn runat="server" DisplayText="Default Value" Sortable="true" Width="40%" />
                        </Columns>
                    </k3:Grid>
                </StepContent>
            </k3:WizardStep>

            <k3:WizardStep ID="RulesStep" runat="server">
                <StepContent>
                    <div id="viewActionsListTable" class="wrapper designer-configpanel">

                        <k3:Grid ID="pgRuleList" ActionLinkMessage="<%$ Resources: ViewDesigner, RulesGridActionRowText %>" Behavior="FullSize" runat="server">
                            <toolbars>
                                <k3:ToolbarGroup ID="CompositeMethodsToolbarGroup" runat="server">
                                    <k3:Toolbar ID="CompositeMethodsToolbar" runat="server">
                                        <k3:ToolbarButton ButtonClass="add" ID="toolAddAction" Text="<%$ Resources:AddViewAction %>" runat="server" />
                                        <k3:ToolbarDivider runat="server" />
                                        <k3:ToolbarButton ButtonClass="edit" ID="toolEditAction" Text="<%$ Resources:EditViewAction %>" runat="server" Disabled="true" />
                                        <k3:ToolbarDivider runat="server" />
                                        <k3:ToolbarButton ButtonClass="delete" ID="toolRemoveAction" Text="<%$ Resources:DeleteViewAction %>" runat="server" Disabled="true" />
                                        <k3:ToolbarDivider runat="server" ID="vdRuleEnabledDivider" IsVisible="false" />
                                        <k3:ToolbarButton ButtonClass="enable-view-rule" IsVisible="false" ID="vdToolEnableRule" Text="<%$ Resources:CommonLabels,EnableRuleText%>" runat="server" Disabled="true" />
                                        <k3:ToolbarButton ButtonClass="disable-view-rule" IsVisible="false" ID="vdToolDisableRule" Text="<%$ Resources:CommonLabels,DisableRuleText%>" runat="server" Disabled="true" />
                                        <div class="vdrw-search-wrapper">
                                            <k3:SearchBox runat="Server" 
                                                        ID="vdrwRulesSearchTxt" 
                                                        Watermark="<%$ Resources:CommonActions, SearchText %>"
                                                        SearchButtonID ="vdrwRulesSearchBtn"
                                                        ClearButtonID= "vdrwRulesClearSearchBtn"
                                                        ShowCriteriaOptions="false"
                                                        SearchButtonTooltip="<%$ Resources:AppStudio, SearchAllRulesTooltipRulesLabelText %>"
                                                        ClearButtonToolTip="<%$ Resources:AppStudio, CancelSearchFilterTooltip %>"
                                                            />
                                            <div class="input-control">
                                                <k3:Button id="vdrwRulesFilterBtn" ButtonID="vdrwRulesFilterBtn" runat="server" Type="filter" ButtonStyle="Icon" Title="<%$ Resources:AppStudio, NoFiltersAppliedTooltip %>" />
                                            </div>
                                        </div>
                                    </k3:Toolbar>
                                </k3:ToolbarGroup>
                            </toolbars>
                            <columns>
                                <k3:GridColumn Hidden="true" />
                                <k3:GridColumn DisplayText="<%$ Resources:ViewActionColumnName %>" Width="100%" />
                                <k3:GridColumn Hidden="true" />
                            </columns>
                        </k3:Grid>

                    </div>
                </StepContent>
            </k3:WizardStep>

            <k3:WizardStep ID="SummaryStep" StepName="<%$ Resources: DependencyHelper, SummaryStepTitle %>" runat="server" Hidden="true">
                <StepContent>
                </StepContent>
            </k3:WizardStep>

            <%--<k3:WizardStep ID="stepDone" runat="server">
                <StepContent>
                    <k3:Panel runat="server" ID="ViewDesignerFinishPanel" Behavior="FullSize">
                        <Content>
                        </Content>
                    </k3:Panel>
                </StepContent>
            </k3:WizardStep>--%>
        </Steps>
    </k3:Wizard>
    <k3:HiddenField runat="server" ID="hiddenViewDataXml" />
    <k3:HiddenField runat="server" ID="hiddenViewSettings" />
    <k3:HiddenField runat="server" ID="trackedChanges" />
    <k3:HiddenField runat="server" ID="mustCommitChanges" />
    <div id="divPropertyGrid" style="display: none; width: 450px; height: 300px; overflow: hidden">
    </div>
    <div id="divComplexProperty" style="display: none; width: 280px; height: 280px">
    </div>
    <div id="divChangeControl" style="display: none;" class="changeControlContainer">
    </div>
    <div id="divCellProperties" style="display: none; width: 300px; height: 300px; margin-right: 30px">
    </div>
    <div id="divCanvasProperties" style="display: none; width: 300px; height: 300px; margin-right: 30px">
    </div>
    <div id="divConditionsMapping" style="display: none">
    </div>
    <div id="dragContentHolder" class="theme-entry" style="position: fixed; width: 0px;">
    </div>
    <div id="divControlCalculation" style="display: none">
        <div id="viewExpressionListTable" class="absoluteFullWrapperOverflow">
        </div>
    </div>


    <div id="divSettings" style="visibility: collapse">
        <div id="tableLayoutOptions" >
            <div>
                <span id="EmptyViewIcon"></span>
                <span id="EmptyView"><%=(string)GetLocalResourceObject("EmptyView")%></span>
            </div>
            <div style="height: 16px"></div>
            <div style="width: inherit; height: 52px;" class="designer-option" id="divAutoGenerateOption">
                <label class="blank-view-options">
                    <span>
                        <input style="display: none" type="button" id="btnAutoGenerate" />
                        <span id="AutoGenerateIcon" class="layout-auto-generate32 inactive"></span>
                        <span class="blank-view-options-title" id="OptionGenerate">*Option Generate</span>
                        <div style="height: 6px"></div>
                        <span class="blank-view-options-description" id="OptionGenerateDescription">*Option Generate Desc</span>
                    </span>
                </label>
            </div>
            <div style="height: 16px"></div>
            <div style="width: inherit; height: 52px" class="designer-option" id="divInsertTableOption">
                <label class="blank-view-options">
                    <span>
                        <input style="display: none" type="button" id="btnBlankLayout" />
                        <span id="InsertTableIcon" class="layout-create-blank32 inactive"></span>
                        <span class="blank-view-options-title" id="OptionInsertTable">*Option Insert Table</span>
                        <div style="height: 6px"></div>
                        <span class="blank-view-options-description" id="OptionInsertTableDescription">*Option Insert Table Desc</span>
                    </span>
                </label>
            </div>
        </div>

        <div id="ViewSettings">

            <k3:Expander ID="TableExpander" runat="server" Header="<%$ Resources:ExpanderTableHeader %>" Description="<%$ Resources:ExpanderTableDescription %>">
                <RightContent>
                    <div>
                        <k3:FormField ID="FormField4" runat="server" Text="<%$ Resources:FormDesigner, TableColumnCountLabel%>" For="vdcolumnGeneration" LabelWidth="Normal">
                            <k3:Textbox id="vdcolumnGeneration" MaxLength="2" Value="2" runat="server" />
                        </k3:FormField>
                    </div>
                </RightContent>
            </k3:Expander>

            <k3:Expander ID="LayoutExpander" runat="server" Header="<%$ Resources:ViewLayoutTitle %>" Description="<%$ Resources:ViewLayoutDescription %>">
                <RightContent>
                    <div>
                        <div id="LayoutGeneratedFields">
                            <div>
                                <div id="autoGeneratedFieldsGroup">
                                    <table id="autogenFieldsTable">
                                        <colgroup>
                                            <col class="label-column" />
                                            <col class="setting-column" />
                                            <col id="colDisplayOnly" class="setting-column" />
                                        </colgroup>
                                        <thead>
                                            <tr>
                                                <th><%=(string)GetLocalResourceObject("FieldNameText")%></th>
                                                <th><%=(string)GetLocalResourceObject("IncludeLabelText")%></th>
                                                <th id="DisplayOnlyHeader"><%=(string)GetLocalResourceObject("DisplayOnlyText")%></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <label id="vdViewAutoGenerateAllFieldsFF" class="IncludePropertiesText">All Fields</label>
                                                </td>
                                                <td>
                                                    <k3:Checkbox id="vdchkGenerateAllFieldsInclude" checked="false" runat="server" />
                                                </td>
                                                <td>
                                                    <k3:Checkbox id="vdchkGenerateAllFieldsReadOnly" checked="false" runat="server" />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </RightContent>
            </k3:Expander>

            <div id="FormsViewSettings">

                <k3:Expander runat="server" ID="LabelsExpander" Header="<%$ Resources:LabelsTitle %>" Description="<%$ Resources:LabelsDescription %>">
                    <RightContent>
                        <div>
                            <k3:FormField runat="server" Text="<%$ Resources:Designers, LabelPositionText%>" For="vdrbLabelType" LabelWidth="Normal">
                                <select id="vdrbLabelType">
                                    <option value="vdrbLabelTop"><%=(string)GetLocalResourceObject("AutoGenerateLabelTypeTop")%></option>
                                    <option value="vdrbLabelLeft"><%=(string)GetLocalResourceObject("AutoGenerateLabelTypeLeft")%></option>
                                </select>
                            </k3:FormField>
                            <k3:FormField runat="server" Text="<%$ Resources:Designers, LabelSuffixText%>" For="vdaddColonSuffixChk" LabelWidth="Normal">
                                <k3:Checkbox id="vdaddColonSuffixChk" Checked="false" Label="" runat="server" />
                            </k3:FormField>
                        </div>
                    </RightContent>
                </k3:Expander>

                <k3:Expander runat="server" ID="ButtonsExpander" Header="<%$ Resources:ButtonsTitle %>" Description="<%$ Resources:ButtonsDescription %>">
                    <RightContent>
                        <div>
                            <table id="MethodButtonsTable">
                                <colgroup>
                                    <col class="label-column" />
                                    <col class="setting-column" />
                                    <col class="setting-column" />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th><%=(string)GetLocalResourceObject("AutoGenerateButtonTypeStandard")%></th>
                                        <th><%=(string)GetLocalResourceObject("AutoGenerateButtonTypeToolbar")%></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><%=(string)GetLocalResourceObject("ViewAutoGenerateAllMethods")%></td>
                                        <td>
                                            <k3:Checkbox runat="server" id="vdchkAllMethodsStandardButtons" />
                                        </td>
                                        <td>
                                            <k3:Checkbox runat="server" id="vdchkAllMethodsToolbarButtons" />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </RightContent>
                </k3:Expander>

            </div>

            <div id="ListViewEditOptions">
                <k3:Expander ID="EditOptionsExpander" runat="server" Header="<%$ Resources:EditOptionsTitle %>" Description="<%$ Resources:EditOptionsDescription %>">
                    <RightContent>
                        <div>
                            <k3:Checkbox runat="server" id="vdchkEnableListEditing" Label="<%$ Resources:EnableListEditingChk %>" />

                            <div style="margin-left: 20px; margin-top: 4px">
                                <k3:RadioButtonGroup id="EditRowsRadioButtonGroup" runat="server">
                                    <k3:RadioButton runat="server" Name="EditRowsRadioButtonGroup" id="vdrbEditAllRows" Label="<%$ Resources:EditAllRowsOptions %>" Checked="true" />
                                    <k3:RadioButton runat="server" Name="EditRowsRadioButtonGroup" id="vdrbEditSingleRows" Label="<%$ Resources:EditSingleRowsOptions %>" Checked="false" />
                                </k3:RadioButtonGroup>

                                <div id="EditOptions_AllRows_Options">
                                    <div id="EditOptions_AllRows_Options_CBs">
                                        <k3:CheckboxGroup runat="server" Collapsed="false">
                                            <k3:Checkbox runat="server" id="vdallowUserAddRowsELChk" Label="<%$ Resources:AllowUserAddNewRowsText %>" Checked="true" />
                                            <k3:Checkbox runat="server" id="vdallowUserEditELChk" Label="<%$ Resources:AllowUserEditRowsText %>" Checked="false" />
                                            <k3:Checkbox runat="server" id="vdallowUserRemoveELChk" Label="<%$ Resources:AllowUserRemoveRowsText %>" Checked="false" />
                                        </k3:CheckboxGroup>
                                    </div>
                                    <div id="EditOptions_AllRows_Options_DDs">
                                        <div>
                                            <div style="width: 120px; float: left; margin-left: 6px">
                                                <select id="vdlistEditAddMethod" class="input-control"></select>
                                            </div>
                                            <div style="display: inline-block; margin-top: 3px; padding-left: 10px">
                                                <label id="AddMethodLabel"><%=(string)GetLocalResourceObject("MethodLabel")%></label>
                                            </div>
                                            <div style="clear: both"></div>
                                        </div>

                                        <div style="padding-top: 4px">
                                            <div style="width: 120px; float: left; margin-left: 6px">
                                                <select id="vdlistEditEditMethod" class="input-control"></select>
                                            </div>
                                            <div style="display: inline-block; margin-top: 3px; padding-left: 10px">
                                                <label id="EditMethodLabel"><%=(string)GetLocalResourceObject("MethodLabel")%></label>
                                            </div>
                                            <div style="clear: both"></div>
                                        </div>

                                        <div style="padding-top: 4px">
                                            <div style="width: 120px; float: left; margin-left: 6px">
                                                <select id="vdlistEditDeleteMethod" class="input-control"></select>
                                            </div>
                                            <div style="display: inline-block; margin-top: 3px; padding-left: 10px">
                                                <label id="DeleteMethodLabel"><%=(string)GetLocalResourceObject("MethodLabel")%></label>
                                            </div>
                                            <div style="clear: both"></div>
                                        </div>
                                    </div>
                                </div>
                                <k3:Checkbox runat="server" id="vdchkShowAddRow" Label="<%$ Resources:SettingsShowAddRow %>" AdditionalCssClass="EnableAddNewRowLink" />
                            </div>
                        </div>
                    </RightContent>
                </k3:Expander>
                <k3:Expander ID="AdditionalOptionsExpander" runat="server" Header="<%$ Resources:ListViewAdditionalOptionsHeader %>" Description="<%$ Resources:ListViewAdditionalOptionsDescription %>">
                    <RightContent>
                        <k3:Checkbox runat="server" ID="vdAllowUserReload" Label="<%$ Resources:AllowUserReloadListText %>" Checked="false" />
                    </RightContent>
                </k3:Expander>
            </div>


            <k3:Panel runat="server" ID="ListViewSettings" Behavior="FullSize" Scrolling="true">
                <Content>
                    <k3:Expander ID="StyleExpander" runat="server" Header="<%$ Resources:StyleTitle %>" Description="<%$ Resources:StyleDescription %>">
                        <RightContent>
                            <div>
                                <k3:CheckboxGroup runat="server" Collapsed="false">
                                    <k3:CheckBox runat="server" id="vdchkShadeAlternatingRows" Label="<%$ Resources:AlternateRowsChk %>" Checked="false" />
                                    <k3:CheckBox runat="server" id="vdchkBoldHeadingRow" Label="<%$ Resources:BoldHeadingRogChk %>" Checked="false" />
                                </k3:CheckboxGroup>
                            </div>
                        </RightContent>
                    </k3:Expander>

                    <k3:Expander ID="SortExpander" runat="server" Collapsed="false" Header="<%$ Resources:SortTitle %>" Description="<%$ Resources:SortDescription %>">
                        <RightContent>
                            <div>
                                <label>Sorting Options:</label>
                                <div style="margin-top: 6px">
                                    <k3:Button id="vdbtnSortOptions" Text="<%$ Resources:ConfigureButtonText %>" runat="server" />
                                </div>
                            </div>
                        </RightContent>
                    </k3:Expander>

                    <k3:Expander ID="FilterExpander" runat="server" Collapsed="false" Header="<%$ Resources:FilterTitle %>" Description="<%$ Resources:FilterDescription %>">
                        <RightContent>
                            <div>
                                <label>Filtering Options:</label>
                                <div style="margin-top: 6px">
                                    <k3:Button id="vdbtnFilterOptions" Text="<%$ Resources:ConfigureButtonText %>" runat="server" />
                                </div>
                            </div>
                        </RightContent>
                    </k3:Expander>

                    <k3:Expander ID="UserSettingsExpander" runat="server" Collapsed="false" Header="<%$ Resources:UserSettingsTitle %>" Description="<%$ Resources:UserSettingsDescription %>">
                        <RightContent>
                            <div>
                                <k3:CheckBox runat="server" id="vdshowFilter" Label="<%$ Resources:EnableFilteringChk %>" Checked="true" />
                                <div style="margin-top: 4px; margin-bottom: 4px">
                                    <div style="float: left">
                                        <k3:CheckBox runat="server" id="vdallowListViewPaging" Label="<%$ Resources:AllowPagingText %>" Checked="false" />
                                    </div>

                                    <div style="display: inline-block; margin-left: 7px">
                                        <k3:Textbox id="vdtxtListViewLinesPerPage" MaxLength="4" Width="40" Value="10" runat="server" />
                                    </div>

                                    <div style="display: inline-block; margin-left: 2px; vertical-align: top; margin-top: 3px">
                                        <label id="vdtxtItemsPerPage"><%=(string)GetLocalResourceObject("ItemsPerPageText")%></label>
                                    </div>
                                </div>

                                <div>
                                    <k3:CheckBox runat="server" id="chkEditableListOption" Label="<%$ Resources:EnableListEditingChk %>" />
                                </div>

                                <div style="margin-top: 3px">
                                    <k3:Checkbox runat="server" id="chkShowAddRowExt" Label="<%$ Resources:SettingsShowAddRow %>" />
                                </div>
                                <div style="margin-top: 3px">
                                    <k3:Checkbox runat="server" id="chkMultiSelect" Label="<%$ Resources:AllowMutipleSelection %>" />
                                </div>
                                <div style="margin-top: 3px">
                                    <k3:Checkbox runat="server" id="chkCellContentSelect" Label="<%$ Resources:AllowCellContentSelection %>" />
                                </div>
                            </div>
                        </RightContent>
                    </k3:Expander>
                </Content>
            </k3:Panel>

        </div>

    </div>
    <script type="text/javascript">
        var ObjectNames = {
            application: {
                singular: '<%= GetGlobalResourceObject("ObjectNames", "SmartAppSingular") %>',
                plural: '<%= GetGlobalResourceObject("ObjectNames", "SmartAppPlural") %>'
            },
            form: {
                singular: '<%= GetGlobalResourceObject("ObjectNames", "SmartFormSingular") %>',
                plural: '<%= GetGlobalResourceObject("ObjectNames", "SmartFormPlural") %>'
            },
            view: {
                singular: '<%= GetGlobalResourceObject("ObjectNames", "SmartViewSingular") %>',
                plural: '<%= GetGlobalResourceObject("ObjectNames", "SmartViewPlural") %>'
            },
            report: {
                singular: '<%= GetGlobalResourceObject("ObjectNames", "ReportSingular") %>',
                plural: '<%= GetGlobalResourceObject("ObjectNames", "ReportPlural") %>'
            },
            smartobject: {
                singular: '<%= GetGlobalResourceObject("ObjectNames", "SmartObjectSingular") %>',
                plural: '<%= GetGlobalResourceObject("ObjectNames", "SmartObjectPlural") %>'
            },
            smartfunction: {
                singular: '<%= GetGlobalResourceObject("ObjectNames", "SmartFunctionSingular") %>',
                plural: '<%= GetGlobalResourceObject("ObjectNames", "SmartFunctionPlural") %>'
            },
            category: {
                singular: '<%= GetGlobalResourceObject("ObjectNames", "CategorySingular") %>',
                plural: '<%= GetGlobalResourceObject("ObjectNames", "CategoryPlural") %>'
            },
            process: {
                singular: '<%= GetGlobalResourceObject("ObjectNames", "WorkflowProcessSingular") %>',
                plural: '<%= GetGlobalResourceObject("ObjectNames", "WorkflowProcessPlural") %>'
            }
        }
    </script>
</asp:Content>
