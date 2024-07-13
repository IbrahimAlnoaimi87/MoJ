using SourceCode.Categories.Client;
using SourceCode.EnvironmentSettings.Client;
using SourceCode.Forms.AppFramework;
using SourceCode.Forms.Controls.Web.SDK.Attributes;
using SourceCode.Forms.Management;
using SourceCode.Forms.Utilities;
using SourceCode.Forms.Web.Controls;
using SourceCode.SmartObjects.Client;
using SourceCode.SmartObjects.Management;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml;
using tlc = SourceCode.Forms.Utilities.TableLayout.Client;
using tla = SourceCode.Forms.Utilities.TableLayout.Authoring;
using System.Collections;
using System.Web;

namespace SourceCode.Forms.Views
{
    [ValidateAntiXSRFToken]
    public partial class PartialPage : System.Web.UI.Page
    {
        private const string DEFAULT_TOOLBOX_PANE_WIDTH = "300px";

        #region Fields
        private FormsManager _formsManager;
        internal static IHttpContextItems _httpContextItem;
        #endregion

        static PartialPage()
        {
            _httpContextItem = new HttpContextItems();
        }

        protected void Page_Load(object sender, EventArgs e)
        {
            FormsManager formsManager = GetFormsManager();
            SmartObjectManagementServer managementServer = null;
            CategoryServer client = null;

            try
            {
                RegisterInsideAreaItem();

                this.Context.Response.Cache.SetNoStore();

                string viewId = this.Request.Form["id"];
                string in_CategoryID = this.Request.Form["categoryid"];
                string in_ObjectID = this.Request.Form["contextid"];
                bool IsViewEdit = false;

                #region Build View Setup Elements
                XmlDocument viewDataDoc = new XmlDocument();

                XmlElement viewDataRootEl = viewDataDoc.CreateElement("SourceCode.Forms");
                XmlElement isViewEditEl = viewDataDoc.CreateElement("IsViewEdit");
                XmlElement viewDefinitionEl = viewDataDoc.CreateElement("ViewDefinition");
                XmlElement viewCheckedOutStatusEl = viewDataDoc.CreateElement("ViewCheckedOutStatus");
                XmlElement checkedOutByEl = viewDataDoc.CreateElement("ViewCheckedOutBy");
                XmlElement viewCategoryPathEl = viewDataDoc.CreateElement("ViewCategoryPath");
                XmlElement viewCategoryIDEl = viewDataDoc.CreateElement("ViewCategoryID");
                XmlElement viewSmartObjectGuidEl = viewDataDoc.CreateElement("ViewSmartObjectGuid");
                XmlElement ViewEditorCanvasHTMLEl = viewDataDoc.CreateElement("ViewEditorCanvas");
                XmlElement ViewCategoryDisplayPathEl = viewDataDoc.CreateElement("ViewCategoryDisplayPath");
                XmlElement ViewSmartObjectPathEl = viewDataDoc.CreateElement("ViewSmartObjectPath");
                XmlElement TypeDefaultControlsEl = viewDataDoc.CreateElement("TypeDefaultControls");
                XmlElement EditorCanvasIdEl = viewDataDoc.CreateElement("EditorCanvasID");
                XmlElement CurrentUserEl = viewDataDoc.CreateElement("CurrentUser");

                viewDataRootEl.AppendChild(isViewEditEl);
                viewDataRootEl.AppendChild(viewCheckedOutStatusEl);
                viewDataRootEl.AppendChild(checkedOutByEl);
                viewDataRootEl.AppendChild(viewCategoryPathEl);
                viewDataRootEl.AppendChild(viewCategoryIDEl);
                viewDataRootEl.AppendChild(viewSmartObjectGuidEl);
                viewDataRootEl.AppendChild(ViewCategoryDisplayPathEl);
                viewDataRootEl.AppendChild(ViewSmartObjectPathEl);
                viewDataRootEl.AppendChild(CurrentUserEl);
                viewDataRootEl.AppendChild(EditorCanvasIdEl);
                viewDataRootEl.AppendChild(TypeDefaultControlsEl);
                viewDataRootEl.AppendChild(ViewEditorCanvasHTMLEl);
                viewDataRootEl.AppendChild(viewDefinitionEl);
                viewDataDoc.AppendChild(viewDataRootEl);
                #endregion

                if (string.IsNullOrEmpty(viewId))
                    IsViewEdit = false;
                else
                    IsViewEdit = true;

                isViewEditEl.AppendChild(viewDataDoc.CreateCDataSection(IsViewEdit.ToString()));

                // Toolbar icons //
                AddTableToolbarItems();
                AddControlToolbarItems();

                if (IsViewEdit == true)
                {
                    // get rendered view HTML //
                    SourceCode.Forms.Client.FormsClient FormsClient = SourceCode.Forms.AppFramework.ConnectionClass.GetFormsClient();
                    SourceCode.Forms.Client.View clientView = FormsClient.GetView(new Guid(viewId));

                    tlc.TableLayout.FixDirtyGridLayouts(clientView);

                    if (clientView == null)
                    {
                        if (formsManager.CheckViewExists(new Guid(viewId)))
                        {
                            CustomException customError = new CustomException((string)GetGlobalResourceObject("ExceptionHandler", "ViewError"));
                            customError.Data.Add("Type", (string)GetGlobalResourceObject("ExceptionHandler", "ViewErrorType"));
                            customError.Data.Add("Source", (string)GetGlobalResourceObject("ExceptionHandler", "ViewCheckinErrorSource"));
                            throw customError;
                        }
                        else
                        {
                            CustomException customError = new CustomException((string)GetGlobalResourceObject("ExceptionHandler", "ViewError"));
                            customError.Data.Add("Type", (string)GetGlobalResourceObject("ExceptionHandler", "ViewErrorType"));
                            customError.Data.Add("Source", (string)GetGlobalResourceObject("ExceptionHandler", "ViewErrorSource"));
                            throw customError;
                        }
                    }

                    if (clientView.IsSystem == true)
                    {
                        CustomException customError = new CustomException((string)GetGlobalResourceObject("ExceptionHandler", "SystemViewEditError"));
                        customError.Data.Add("Type", (string)GetGlobalResourceObject("ExceptionHandler", "SystemViewErrorType"));
                        customError.Data.Add("Source", (string)GetGlobalResourceObject("ExceptionHandler", "SystemViewErrorSource"));
                        throw customError;
                    }

                    Rendering.Web.Renderer renderer = new Rendering.Web.Renderer();
                    renderer.GetApplicationPath = () => { return Page.Request.ApplicationPath; };

                    string desigtimeHTML = renderer.RenderDesignTime(clientView);
                    ////////////////////////////

                    // load xml of existing view //
                    var viewDefinition = formsManager.GetViewDefinition(new System.Guid(viewId));
                    SourceCode.Forms.Authoring.View thisView = new SourceCode.Forms.Authoring.View();
                    thisView.FromXml(viewDefinition);

                    tla.TableLayout.FixDirtyGridLayouts(thisView);

                    SourceCode.Forms.Utilities.RuleHelper ruleHelper = AppFramework.ConnectionClass.GetRuleHelper(Global.EnabledFeatures);

                    CleanFieldsForChangedSmoProperties(thisView);

                    // Analyze & validate View
                    try
                    {
                        using (var analyzer = ConnectionClass.GetAnalyzer(formsManager.Connection, Global.EnabledFeatures))
                        {
                            analyzer.Analyze(thisView);
                        }
                    }
                    catch (Exception ex)
                    {
                        Logging.Instance.WriteToLog(LoggingCategoryType.ViewDesigner, ex.ToString(), LogType.Error);
                    }

                    #region - Rule Friendly Name Generation & Location Calculations -

                    var couldNotResolve = new Queue<Authoring.Eventing.Event>();
                    foreach (SourceCode.Forms.Authoring.Eventing.Event authEvent in thisView.Events)
                    {
                        if (authEvent.EventType == Authoring.Eventing.EventType.User)
                        {
                            RuleHelper.Context ruleContext = ruleHelper.GetRuleContext(authEvent);
                            authEvent.Properties["RuleFriendlyName"] = ruleContext.RuleFriendlyName;
                            authEvent.Properties["Location"] = ruleContext.Location;

                            // TODO: The rule helper should not remove rules
                            if (string.IsNullOrEmpty(authEvent.Properties["RuleFriendlyName"]))
                            {
                                couldNotResolve.Enqueue(authEvent);
                            }
                        }
                    }

                    // TODO: The rule helper should not remove rules
                    if (couldNotResolve.Count > 0)
                    {
                        this.mustCommitChanges.Value = "1";
                        while (couldNotResolve.Count > 0)
                        {
                            var @event = couldNotResolve.Dequeue();
                            (@event.Container as Authoring.Eventing.State).Events.Remove(@event);
                        }
                    }

                    #endregion

                    #region - Update Expressions with Display Values -
                    SourceCode.Forms.Utilities.ExpressionHelper exphelper = ConnectionClass.GetExpressionHelper();
                    EnvironmentSettingsManager envSettingsManager = ConnectionClass.GetEnvironmentSettingsManagerInstance();
                    EnvironmentFieldCollection envFields = envSettingsManager.CurrentEnvironment.EnvironmentFields;
                    exphelper.EnvironmentFields = envFields;

                    // Generate expression preview values
                    exphelper.GenerateDisplayPreviewForExpressions(thisView.Expressions);
                    #endregion

                    viewDefinition = thisView.ToXml();

                    XmlDocument viewDefinitionXmlDoc = XmlHelper.CreateXmlDocument(viewDefinition);

                    if (!string.IsNullOrEmpty(thisView.Description))
                    {
                        SourceCode.Forms.Web.Controls.Input.TextArea txtDescription = DetailsStep.FindControl("vdtxtViewDescription") as SourceCode.Forms.Web.Controls.Input.TextArea;
                        txtDescription.Value = thisView.Description;
                    }

                    XmlNodeList validationProperties = viewDefinitionXmlDoc.SelectNodes("SourceCode.Forms/Views/View/Controls/Control/Properties/Property[Name/text()='ValidationPattern']");
                    if (validationProperties.Count > 0)
                    {
                        SourceCode.Forms.Utilities.FormsHelper formsHelper = AppFramework.ConnectionClass.GetFormsHelper(Global.EnabledFeatures);
                        formsHelper.SetValidationPropertiesDisplayValues(viewDefinitionXmlDoc, validationProperties);
                    }

                    //Update view definition with latest authoring model
                    viewDefinition = viewDefinitionXmlDoc.OuterXml;
                    viewDefinitionEl.AppendChild(viewDataDoc.CreateTextNode(viewDefinition));

                    ViewInfo thisViewInfo = AppFramework.ViewFramework.GetViewInfo(new System.Guid(viewId));

                    if (thisViewInfo == null)
                    {
                        throw new Exception(string.Format(Resources.ExceptionHandler.ViewNotFound, viewId));
                    }

                    viewCheckedOutStatusEl.AppendChild(viewDataDoc.CreateCDataSection(((thisViewInfo.IsCheckedOut) ? "1" : "0")));

                    checkedOutByEl.AppendChild(viewDataDoc.CreateCDataSection(thisViewInfo.CheckedOutBy));

                    string ViewSmartObjectGuid = string.Empty;
                    CategoryHelper.Category category = null;

                    CategoryHelper CatHelper = ConnectionClass.GetCategoryHelper();
                    try
                    {
                        category = CatHelper.GetCategoryOrDefault(new Guid(viewId), CategoryServer.dataType.View, null, null);
                    }
                    catch (NotAuthorizedException)
                    {

                    }

                    if (category != null)
                    {
                        viewCategoryPathEl.AppendChild(viewDataDoc.CreateCDataSection(category.Path));
                        viewCategoryIDEl.AppendChild(viewDataDoc.CreateCDataSection(category.Id.ToString()));
                        ViewCategoryDisplayPathEl.AppendChild(viewDataDoc.CreateCDataSection(category.FullPath));

                        // Update the recent folders setting
                        DesignerFramework df = new DesignerFramework();
                        df.UpdateRecentUserCategories(category.Id);
                    }
                    else 
                    {
                        var formField1 = (SourceCode.Forms.Web.Controls.FormField)DetailsStep.FindControl("FormField1");
                        var viewNameTextBox = (SourceCode.Forms.Web.Controls.Input.Textbox)formField1.FindControl("vdtxtViewName");
                        viewNameTextBox.Disabled = true;
                        viewNameTextBox.CssClass = "unAuthorized";

                        var formField8 = (SourceCode.Forms.Web.Controls.FormField)DetailsStep.FindControl("FormField8");
                        var pgCategoryLookup = (SourceCode.Forms.Web.Controls.CategoryLookup)formField8.FindControl("ViewDesignerCategoryLookup");
                        var notAuthenticatedForCategoryText = GetGlobalResourceObject("Wizard", "ObjectNoViewRightsWatermarkTextCategoryIndefiniteSingular").ToString();
                        pgCategoryLookup.Watermark = notAuthenticatedForCategoryText;
                        pgCategoryLookup.Disabled = true;
                    }


                    if (thisView.Source == null)
                    {
                        ViewSmartObjectGuid = "";
                        viewSmartObjectGuidEl.AppendChild(viewDataDoc.CreateCDataSection(""));
                    }
                    else
                    {
                        ViewSmartObjectGuid = thisView.Source.SourceID;
                        viewSmartObjectGuidEl.AppendChild(viewDataDoc.CreateCDataSection(ViewSmartObjectGuid));
                    }

                    ViewEditorCanvasHTMLEl.AppendChild(viewDataDoc.CreateCDataSection(desigtimeHTML));


                    this.ViewEditorCanvas.InnerHtml = desigtimeHTML;

                    if (!string.IsNullOrEmpty(ViewSmartObjectGuid))
                    {
                        var smoCategory = CatHelper.GetObjectCategory(new Guid(ViewSmartObjectGuid));

                        if (smoCategory != null)
                        {
                            string ViewSmartObjectPath = smoCategory.FullPath + "\\" + thisView.Source.Name;

                            ViewSmartObjectPathEl.AppendChild(viewDataDoc.CreateCDataSection(ViewSmartObjectPath));
                        }
                    }
                }
                else
                {
                    viewDefinitionEl.AppendChild(viewDataDoc.CreateCDataSection(SourceCode.Forms.AppFramework.ViewFramework.BuildBlankViewXml()));
                    viewCheckedOutStatusEl.AppendChild(viewDataDoc.CreateCDataSection("1"));
                    checkedOutByEl.AppendChild(viewDataDoc.CreateCDataSection(ConnectionClass.GetCurrentUser()));
                    viewCategoryPathEl.AppendChild(viewDataDoc.CreateCDataSection(""));

                    // Build Blank XMl only for a new view //
                    CategoryHelper CatHelper = ConnectionClass.GetCategoryHelper();

                    // Setting SmartObject Detials //
                    if (String.IsNullOrEmpty(in_ObjectID))
                    {
                        viewSmartObjectGuidEl.AppendChild(viewDataDoc.CreateCDataSection(""));
                    }
                    else
                    {

                        viewSmartObjectGuidEl.AppendChild(viewDataDoc.CreateCDataSection(in_ObjectID));
                        var ViewSmartObjectGuid = in_ObjectID;

                        CategoryHelper.Category smoCategory = CatHelper.GetObjectCategory(new Guid(ViewSmartObjectGuid));

                        Guid[] guidArray = new Guid[1];
                        guidArray[0] = new Guid(ViewSmartObjectGuid);

                        client = SourceCode.Forms.AppFramework.ConnectionClass.GetCategoryClient();
                        managementServer = SourceCode.Forms.AppFramework.ConnectionClass.GetSmartObjectManager();

                        var explorer = managementServer.GetSmartObjects(guidArray, false);

                        if (smoCategory != null && string.IsNullOrEmpty(in_CategoryID))
                        {
                            //lets set the categoryID to ensure that the category path is preserved
                            in_CategoryID = smoCategory.Id.ToString();
                        }

                        if (smoCategory != null && explorer != null)
                        {
                            string ViewSmartObjectPath = smoCategory.FullPath + @"\" + explorer.SmartObjects[0].Name;

                            ViewSmartObjectPathEl.AppendChild(viewDataDoc.CreateCDataSection(ViewSmartObjectPath));
                        }
                    }

                    // Setting Category Details //
                    if (String.IsNullOrEmpty(in_CategoryID))
                    {
                        viewCategoryIDEl.AppendChild(viewDataDoc.CreateCDataSection(""));
                    }
                    else
                    {
                        CategoryHelper.Category cater = CatHelper.GetCategory(int.Parse(in_CategoryID));
                        string catPath = cater.Path;
                        string catFullPath = cater.FullPath;

                        viewCategoryIDEl.AppendChild(viewDataDoc.CreateCDataSection(in_CategoryID));
                        viewCategoryPathEl.AppendChild(viewDataDoc.CreateCDataSection(catPath));
                        ViewCategoryDisplayPathEl.AppendChild(viewDataDoc.CreateCDataSection(catFullPath));
                    }
                }

                //Get User Settings
                GetUserViewSettings(formsManager, IsViewEdit);
                TypeDefaultControlsEl.AppendChild(viewDataDoc.CreateCDataSection(SourceCode.Forms.AppFramework.ViewFramework.GetTypeDefaultControls()));
                EditorCanvasIdEl.AppendChild(viewDataDoc.CreateCDataSection(this.ViewEditorCanvas.ClientID));
                CurrentUserEl.AppendChild(viewDataDoc.CreateCDataSection(ConnectionClass.GetCurrentUser()));

                //Wizard Resources
                DetailsStep.StepName = (string)GetLocalResourceObject("WizardDetailsStepName");
                LayoutStep.StepName = (string)GetLocalResourceObject("WizardLayoutStepName");
                RulesStep.StepName = (string)GetLocalResourceObject("WizardRuleStepName");

                hiddenViewDataXml.Value = viewDataDoc.OuterXml;
            }
            catch (Exception ex)
            {
                CustomException customException = ex as CustomException;
                if (customException != null)
                {
                    throw customException;
                }
                else
                {
                    throw;
                }
            }
            finally
            {
                ConnectionClass.Cleanup(formsManager);
                ConnectionClass.Cleanup(managementServer);
                ConnectionClass.Cleanup(client);
            }
        }

        private FormsManager GetFormsManager()
        {
            if (_formsManager == null)
            {
                _formsManager = ConnectionClass.GetFormsManager();
            }

            return _formsManager;
        }

        private void GetUserViewSettings(FormsManager wsManager, Boolean isViewEdit)
        {
            SettingCollection coll = wsManager.User.Settings;

            #region Intro Page
            //SourceCode.Forms.Web.Controls.Panel IntroPanel = (SourceCode.Forms.Web.Controls.Panel)IntroductionStep.FindControl("ViewDesignerIntroPanel");
            //SourceCode.Forms.Web.Controls.Input.Checkbox ShowIntro = (SourceCode.Forms.Web.Controls.Input.Checkbox)IntroPanel.FindControl("vdShowIntroCheckbox");

            //if (coll["DesignerIntro"].Value != null && coll["DesignerIntro"].Value == "false")
            //{
            //	IntroductionStep.Active = false;
            //	DetailsStep.Active = true;
            //	ShowIntro.Checked = false;
            //}
            //else
            //{
            //	IntroductionStep.Active = true;
            //}

            if (isViewEdit)
            {
                //IntroductionStep.Active = false;
                DetailsStep.Active = false;
                LayoutStep.Active = true;
            }
            else
            {
                DetailsStep.Active = true;
                LayoutStep.Active = false;
            }

            //ShowIntro.Label = String.Format(GetGlobalResourceObject("Wizard", "ShowIntroPageText").ToString(), GetGlobalResourceObject("Wizard", "ViewText"));
            #endregion

            #region View Options Step
            string viewSettingsValue;

            if (coll["ViewSettings"].Value != null)
            {
                viewSettingsValue = coll["ViewSettings"].Value;
            }
            else
            {
                viewSettingsValue = "<ViewSettings><ViewOptions></ViewOptions></ViewSettings>";
            }

            hiddenViewSettings.Value = viewSettingsValue;
            #endregion

            #region

            SourceCode.Forms.Web.Controls.PaneContainer LayoutPaneContainer = (SourceCode.Forms.Web.Controls.PaneContainer)LayoutStep.FindControl("LayoutPaneContainer");

            SourceCode.Forms.Web.Controls.Pane ToolboxPane = (SourceCode.Forms.Web.Controls.Pane)LayoutPaneContainer.FindControl("vdeditorToolboxPane");

            if (coll["ViewDesignerToolboxPaneWidth"].Value != null)
            {
                SetToolBoxPaneWidth(coll["ViewDesignerToolboxPaneWidth"].Value, ToolboxPane);

            }
            else
            {
                ToolboxPane.Width = DEFAULT_TOOLBOX_PANE_WIDTH;
            }

            //TFS 720744 & 731081
            SourceCode.Forms.Web.Controls.Pane LeftToolboxPane = (SourceCode.Forms.Web.Controls.Pane)LayoutPaneContainer.FindControl("vdToolboxPane");

            if (coll["ViewDesignerLeftToolboxPaneWidth"].Value != null)
            {
                SetLeftToolBoxPaneWidth(coll["ViewDesignerLeftToolboxPaneWidth"].Value, LeftToolboxPane);

            }
            else
            {
                LeftToolboxPane.Width = DEFAULT_TOOLBOX_PANE_WIDTH;
            }

            #endregion
        }

        internal void SetLeftToolBoxPaneWidth(string width, Pane LeftToolboxPane)
        {

            width = width?.Replace("px", "");
            decimal parsedValue;
            if (width != null && decimal.TryParse(width, out parsedValue))
            {
                LeftToolboxPane.Width = $"{Math.Round(parsedValue)}px";
            }
        }

        internal void SetToolBoxPaneWidth(string width, Pane ToolboxPane)
        {

            width = width?.Replace("px", "");
            decimal parsedValue;
            if (width != null && decimal.TryParse(width, out parsedValue))
            {
                ToolboxPane.Width = $"{Math.Round(parsedValue)}px";
            }
        }

        private void AddTableToolbarItems()
        {
            //Divider
            ToolbarDivider divider5 = new ToolbarDivider("TableToolDivider5");

            ToolbarButton toolAutoGenerate = new ToolbarButton("toolAutoGenerate", "", "auto-generate", (string)GetLocalResourceObject("AutoGenerate"));
            ToolbarButton toolInsertTable = new ToolbarButton("toolInsertTable", "", "insert-table", (string)GetLocalResourceObject("InsertTable"));
            ToolbarButton toolDefaultCanvas = new ToolbarButton("toolDefaultCanvas", "", "clear-table", (string)GetLocalResourceObject("DefaultCanvas"));
            ToolbarButton toolExpressions = new ToolbarButton("toolExpressions", "", "sigma", (string)GetLocalResourceObject("Expressions"));

            ToolbarButton toolInsertRowAbove = new ToolbarButton("toolInsertRowAbove", "", "insert-row-above", (string)GetLocalResourceObject("InsertRowAbove"));
            ToolbarButton toolInsertRowBelow = new ToolbarButton("toolInsertRowBelow", "", "insert-row-below", (string)GetLocalResourceObject("InsertRowBelow"));
            ToolbarButton toolInsertColLeft = new ToolbarButton("toolInsertColLeft", "", "insert-column-left", (string)GetLocalResourceObject("InsertColLeft"));
            ToolbarButton toolInsertColRight = new ToolbarButton("toolInsertColRight", "", "insert-column-right", (string)GetLocalResourceObject("InsertColRight"));

            ToolbarDivider divider1 = new ToolbarDivider("TableToolDivider1");

            ToolbarButton toolMergeCellRight = new ToolbarButton("toolMergeCellRight", "", "merge-cell-right", (string)GetLocalResourceObject("MergeCellRight"));
            ToolbarButton toolMergeCellBelow = new ToolbarButton("toolMergeCellBelow", "", "merge-cell-below", (string)GetLocalResourceObject("MergeCellBelow"));

            ToolbarDivider divider2 = new ToolbarDivider("TableToolDivider2");

            ToolbarButton toolClearCell = new ToolbarButton("toolClearCell", "", "clear-cell", (string)GetLocalResourceObject("ClearCell"));
            ToolbarButton toolClearRow = new ToolbarButton("toolClearRow", "", "clear-row", (string)GetLocalResourceObject("ClearRow"));

            ToolbarDivider divider3 = new ToolbarDivider("TableToolDivider3");

            ToolbarButton toolRemoveCol = new ToolbarButton("toolRemoveCol", "", "remove-column", (string)GetLocalResourceObject("RemoveCol"));
            ToolbarButton toolRemoveRow = new ToolbarButton("toolRemoveRow", "", "remove-row", (string)GetLocalResourceObject("RemoveRow"));

            ToolbarDivider divider4 = new ToolbarDivider("TableToolDivider4");

            ToolbarButton toolCellLeftAlign = new ToolbarButton("toolCellLeftAlign", "", "align-left", (string)GetLocalResourceObject("LeftAlign"));
            ToolbarButton toolCellCenterAlign = new ToolbarButton("toolCellCenterAlign", "", "align-center", (string)GetLocalResourceObject("CenterAlign"));
            ToolbarButton toolCellRightAlign = new ToolbarButton("toolCellRightAlign", "", "align-right", (string)GetLocalResourceObject("RightAlign"));

            ToolbarButton toolCellTopAlign = new ToolbarButton("toolCellTopAlign", "", "align-top", (string)GetLocalResourceObject("TopAlign"));
            ToolbarButton toolCellMiddleAlign = new ToolbarButton("toolCellMiddleAlign", "", "align-middle", (string)GetLocalResourceObject("MiddleAlign"));
            ToolbarButton toolCellBottomAlign = new ToolbarButton("toolCellBottomAlign", "", "align-bottom", (string)GetLocalResourceObject("BottomAlign"));

            ToolbarButton toolEditCellProp = new ToolbarButton("toolEditCellProp", "", "edit-cell-props", (string)GetLocalResourceObject("EditCellProp"));
            ToolbarButton toolEditTableProp = new ToolbarButton("toolEditTableProp", "", "edit-table-props", (string)GetLocalResourceObject("EditTableProp"));
            ToolbarButton toolViewSettings = new ToolbarButton("toolViewSettings", "", "view-settings", "Configure View Settings");

            Web.Controls.Toolbar ViewEditorToolbar = this.LayoutStep.FindControl("LayoutPaneContainer").FindControl("editorCanvasPane").FindControl("EditorCanvas").FindControl("vdViewEditorToolbar") as Web.Controls.Toolbar;

            ViewEditorToolbar.Controls.Add(toolAutoGenerate);
            ViewEditorToolbar.Controls.Add(toolInsertTable);
            ViewEditorToolbar.Controls.Add(toolDefaultCanvas);
            ViewEditorToolbar.Controls.Add(toolViewSettings);
            ViewEditorToolbar.Controls.Add(toolExpressions);

            ViewEditorToolbar.Controls.Add(divider5);

            ViewEditorToolbar.Controls.Add(toolInsertRowAbove);
            ViewEditorToolbar.Controls.Add(toolInsertRowBelow);
            ViewEditorToolbar.Controls.Add(toolInsertColLeft);
            ViewEditorToolbar.Controls.Add(toolInsertColRight);

            ViewEditorToolbar.Controls.Add(divider1);

            ViewEditorToolbar.Controls.Add(toolMergeCellRight);
            ViewEditorToolbar.Controls.Add(toolMergeCellBelow);

            ViewEditorToolbar.Controls.Add(divider2);

            ViewEditorToolbar.Controls.Add(toolClearCell);
            ViewEditorToolbar.Controls.Add(toolClearRow);

            ViewEditorToolbar.Controls.Add(divider3);

            ViewEditorToolbar.Controls.Add(toolRemoveCol);
            ViewEditorToolbar.Controls.Add(toolRemoveRow);

            ViewEditorToolbar.Controls.Add(divider4);

            ViewEditorToolbar.Controls.Add(toolCellLeftAlign);
            ViewEditorToolbar.Controls.Add(toolCellCenterAlign);
            ViewEditorToolbar.Controls.Add(toolCellRightAlign);

            ViewEditorToolbar.Controls.Add(toolCellTopAlign);
            ViewEditorToolbar.Controls.Add(toolCellMiddleAlign);
            ViewEditorToolbar.Controls.Add(toolCellBottomAlign);

            //ViewEditorToolbar.Controls.Add(divider5);

            ViewEditorToolbar.Controls.Add(toolEditCellProp);
            ViewEditorToolbar.Controls.Add(toolEditTableProp);
        }

        internal void CleanFieldsForChangedSmoProperties(Authoring.View thisView)
        {
            var sources = thisView.Sources;
            //Get SmartObjects for thisView
            var smoGuids = (from source in sources.Cast<Authoring.Source>()
                            select Guid.Parse(source.SourceID)).ToList();

            var smoList = GetSmartObjects(smoGuids);

            if (smoList.Count > 0)
            {
                //Loop through sources that are non Primary
                foreach (Authoring.Source source in sources)
                {
                    if (source.ContextType == Authoring.ViewSourceContextType.Primary)
                    {
                        continue;
                    }

                    var currentSO = smoList.FirstOrDefault(x => x.Guid.Equals(Guid.Parse(source.SourceID)));

                    if (currentSO == null)
                    {
                        continue;
                    }

                    //Clean Fields if not found
                    for (int i = source.Fields.Count - 1; i > -1; i--)
                    {
                        Authoring.Field field = source.Fields[i];

                        var usedProp = currentSO.Properties.GetIndexbyName(field.FieldName);

                        if (usedProp == -1)
                        {
                            source.Fields.Remove(field);
                        }
                    }
                }
            }
        }

        public List<SmartObject> GetSmartObjects(List<Guid> guids)
        {
            var smoGuids = new List<Guid>();
            var smos = new List<SmartObject>();

            var smoCount = guids.Count - 1;
            while (smoCount >= 0)
            {
                var guid = guids[smoCount];
                var so = Caching.Cache.GetSmartObject(guid);
                if (so != null)
                {
                    smos.Add(so);
                }
                else
                {
                    smoGuids.Add(guid);
                }
                smoCount--;
            }

            if (smoGuids.Count > 0)
            {
                var server = ConnectionClass.GetSmartObjectClient();
                var smoArray = server.GetSmartObjects(smoGuids.ToArray());
                foreach (var smo in smoArray)
                {
                    Caching.Cache.SetSmartObject(smo);
                }
                smos.AddRange(smoArray);
            }

            return smos;
        }

        private void AddControlToolbarItems()
        {
            ToolbarButton toolUnbindControl = new ToolbarButton("toolUnbindControl", "", "unbind-control", (string)GetLocalResourceObject("UnbindControl"));

            ToolbarDivider divider4 = new ToolbarDivider("ControlToolDivider4");

            ToolbarButton toolBold = new ToolbarButton("toolBold", "", "bold", (string)GetLocalResourceObject("Bold"));
            ToolbarButton toolItalic = new ToolbarButton("toolItalic", "", "italic", (string)GetLocalResourceObject("Italic"));
            ToolbarButton toolUnderline = new ToolbarButton("toolUnderline", "", "underline", (string)GetLocalResourceObject("Underline"));

            //Divider
            ToolbarDivider divider1 = new ToolbarDivider("ControlToolDivider1");

            ToolbarButton toolTextColor = new ToolbarButton("toolTextColor", "", "text-color", (string)GetLocalResourceObject("TextColor"));
            ToolbarButton toolHightlightColor = new ToolbarButton("toolHightlightColor", "", "text-highlight", (string)GetLocalResourceObject("HightlightColor"));
            ToolbarButton toolLeftAlign = new ToolbarButton("toolLeftAlign", "", "text-align-left", (string)GetLocalResourceObject("LeftAlign"));
            ToolbarButton toolCenterAlign = new ToolbarButton("toolCenterAlign", "", "text-align-center", (string)GetLocalResourceObject("CenterAlign"));
            ToolbarButton toolRightAlign = new ToolbarButton("toolRightAlign", "", "text-align-right", (string)GetLocalResourceObject("RightAlign"));
            ToolbarButton toolJustify = new ToolbarButton("toolJustify", "", "text-align-justify", (string)GetLocalResourceObject("Justify"));

            //Divider
            ToolbarDivider divider2 = new ToolbarDivider("ControlToolDivider2");

            ToolbarButton toolInsertImage = new ToolbarButton("toolInsertImage", "", "insert-image", (string)GetLocalResourceObject("InsertImage"));

            //Divider
            ToolbarDivider divider3 = new ToolbarDivider("ControlToolDivider3");

            ToolbarButton toolControlCalculation = new ToolbarButton("toolControlCalculation", "", "sigma", (string)GetLocalResourceObject("ControlCalculation"));
            ToolbarButton toolEditStyle = new ToolbarButton("toolEditStyle", "", "properties", (string)GetLocalResourceObject("EditStyles"));
            ToolbarButton toolChangeControl = new ToolbarButton("toolChangeControl", "", "change-control", (string)GetLocalResourceObject("ChangeControl"));
            ToolbarButton toolFitToCell = new ToolbarButton("toolFitToCell", "", "fit-to-cell", (string)GetLocalResourceObject("FitToCell"));

            vdViewEditorToolbar.Controls.Add(toolUnbindControl);

            vdViewEditorToolbar.Controls.Add(divider4);

            vdViewEditorToolbar.Controls.Add(toolBold);
            vdViewEditorToolbar.Controls.Add(toolItalic);
            vdViewEditorToolbar.Controls.Add(toolUnderline);

            vdViewEditorToolbar.Controls.Add(divider1);

            vdViewEditorToolbar.Controls.Add(toolTextColor);
            vdViewEditorToolbar.Controls.Add(toolHightlightColor);
            vdViewEditorToolbar.Controls.Add(toolLeftAlign);
            vdViewEditorToolbar.Controls.Add(toolCenterAlign);
            vdViewEditorToolbar.Controls.Add(toolRightAlign);
            vdViewEditorToolbar.Controls.Add(toolJustify);

            vdViewEditorToolbar.Controls.Add(divider2);

            vdViewEditorToolbar.Controls.Add(toolInsertImage);
            vdViewEditorToolbar.Controls.Add(toolFitToCell);

            vdViewEditorToolbar.Controls.Add(divider3);

            vdViewEditorToolbar.Controls.Add(toolChangeControl);
            vdViewEditorToolbar.Controls.Add(toolControlCalculation);
            vdViewEditorToolbar.Controls.Add(toolEditStyle);
        }

        private void RegisterInsideAreaItem()
        {
            if (!_httpContextItem.Items.Contains("InAreaItem"))
            {
                _httpContextItem.Items.Add("InAreaItem", true);
            }
        }
    }
}
