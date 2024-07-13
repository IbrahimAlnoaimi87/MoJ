<%@ Page Language="C#" MasterPageFile="~/MasterPages/PartialPage.Master" AutoEventWireup="true"
	CodeBehind="PartialPage.aspx.cs" Inherits="SourceCode.Forms.Rules.PartialPage" %>

<asp:Content ID="Content1" ContentPlaceHolderID="PartialPageContentPlaceHolder" runat="server">
	<k3:PaneContainer runat="server" Resizable="true" ID="RulesWizardPaneContainer" PaneOrientation="Horizontal">
		<Panes>
			<k3:Pane ID="RulesWizardTopPane" runat="server" Width="300px" MinWidth="190px">
				<Content>
					<k3:Panel runat="server" ID="rwTabbedRuleItemSelectorPanel" ClientIDMode="static" Behavior="FullSize" Scrolling="false" Collapsible="true" Collapsed="false" CollapsibleDirection="Horizontal" 
						 CollapseText="<%$ Resources: CommonActions, CollapseText %>" ExpandText="<%$ Resources: CommonActions, ExpandText %>">						
						<content>
							<div ID="rwToolboxPC" runat="server" ClientIDMode="static">
									<div ID="rwToolboxSearchPane" ClientIDMode="static" runat="server" >
                                        <div id="rwSearchPanelPanel" runat="server" ClientIDMode="static">
                                        </div>
									</div>
									<div ID="rwToolboxPane" ClientIDMode="static" runat="server">
										<k3:TabBox ID="RuleItemTabBox" runat="server" AlignTabs="top" Behavior="Fullsize" CssClass="large">
											<k3:Tabs ID="Tabs1" runat="server">
												<k3:Tab ID="rwTabbedRuleItemEventsTab" runat="server" Icon="rw-events" Selected="true"
													Text="<%$ Resources:RuleStepPanelHeading %>" TabContentId="EventsRulePanelbox" >
												</k3:Tab>
												<k3:Tab ID="rwTabbedRuleItemConditionsTab" runat="server" Icon="rw-conditions" Selected="false"
													Text="<%$ Resources:ConditionStepPanelHeading %>" TabContentId="ConditionsRulePanelbox" >
												</k3:Tab>
												<k3:Tab ID="rwTabbedRuleItemActionsTab" runat="server" Icon="rw-actions" Selected="false"
													Text="<%$ Resources:ActionStepPanelHeading %>" TabContentId="ActionsRulePanelbox" >
												</k3:Tab>
											</k3:Tabs>
											<k3:TabBody ID="rwTabBody1" runat="server">
												<k3:TabContent ID="rwTabbedRuleItemSelectorContent" ClientIDMode="static" runat="server">
													<div class="lyt-rw-toolbox">
                                                        <div class="lyt-rw-searchrow">
                                                            <k3:SearchBox runat="Server" 
                                                                ID="rwSearchTxt" 
                                                                Watermark="<%$ Resources:RuleSearchWatermark %>"
                                                                SearchButtonID ="rwSearchBtn"
                                                                ClearButtonID="rwClearSearchBtn"
                                                                ShowCriteriaOptions="false"
                                                                CssClass="large"
                                                                SearchButtonTooltip="<%$ Resources:CommonActions, SearchText %>"
                                                                ClearButtonToolTip="<%$ Resources:AppStudio, CancelSearchFilterTooltip %>"
                                                                    />
                                                        </div>
                                                        <div class="lyt-rw-contentrow">
                                                            <div class="absoluteFullWrapperOverflow">
														        <div  id="EventsRulePanelbox" ClientIDMode="static" runat="server" class="visible"></div>
														        <div  id="ConditionsRulePanelbox" ClientIDMode="static" runat="server" style="display: none;"></div>
														        <div  ID="ActionsRulePanelbox" ClientIDMode="static" runat="server" style="display: none;"></div>
													        </div>
                                                        </div>
													</div>
                                                    
                                                    
												</k3:TabContent>
											</k3:TabBody>
										</k3:TabBox>
									</div>
							</div>
						</content>
					</k3:Panel>
				</Content>
			</k3:Pane>
			<k3:Pane ID="RulesWizardBottomPane" runat="server" MinWidth="400px" >
				<Content>
					<div id="RuleEditorTabBox" class="wrapper lyt-rw-editorpanel">
                        <div class="lyt-rw-namebar">
                            <div class="rw-name-container file-tab-container light">
                                <div ID="RuleFileTab" class="file-tab">
                                    <div class="layout">
                                        <div class="icon-container"><div class="icon icon-size16 dark"></div></div>
                                        <div class="name-container">
                                            <a href="#"><label></label></a>
                                            <input type="text" />
                                        </div>
                                        <div class="close-container">
                                            <a href="#"><span class="icon icon-size16 ic-close dark"></span></a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="lyt-rw-editor-panel">
                            <div class="absoluteFullWrapperOverflow">
								<div class="wrapper" id="RuleEditor">
									<k3:Panel runat="server" ID="RulePanelbox" Behavior="FullSize">
										<toolbars>
											<k3:ToolbarGroup ID="rwBottomPaneToolbarGroup" runat="server">
												<k3:Toolbar ID="rwBottomPaneToolbar" runat="server">
													<k3:ToolbarDivider ID="rwEnableDisableTbDivider" runat="server" />
													<k3:ToolbarButton Text="<%$ Resources:RuleDesigner, lrMoveDown %>" ID="rwMoveDownRuleTb" ButtonClass="move-down" runat="server" Disabled="true" />
													<k3:ToolbarDivider runat="server" />
													<k3:ToolbarButton Text="<%$ Resources:RuleDesigner, lrMoveUp %>" ID="rwMoveUpRuleTb" ButtonClass="move-up" runat="server" Disabled="true" />
													<k3:ToolbarDivider runat="server" />
													<k3:ToolbarButton Text="<%$ Resources:RuleDesigner, lrRemove %>" ID="rwDeleteRuleTb" ButtonClass="delete" runat="server" Disabled="true" />
													<k3:ToolbarDivider runat="server" />
													<k3:ToolbarButton Text="<%$ Resources:Designers, CommentText %>" ID="rwCommentRuleTb" ButtonClass="comment" runat="server" Disabled="true" />
												</k3:Toolbar>
											</k3:ToolbarGroup>
										</toolbars>
										<content>
											<div id="RulePanelbox_RuleArea"></div>
											<div id="EmptyRuleDesign_Placeholder">
												<table class="outer-panel-table" cellpadding="0" cellspacing="0">
													<tbody>
														<tr>
															<td>
																<table class="inner-panel-table" cellpadding="0" cellspacing="0">
																	<tbody>
																		<tr>
																			<td class="rule-drop-area">
																				<div class="rule-drop-area-item">
																					<div class="rule-drop-area-text">
																						<div class="rule-drop-area-title"><%=GetLocalResourceObject("EmptyRuleDesignAreaHeading")%></div>
																						<hr>
																						<div class="italic-style-font"><%=GetLocalResourceObject("EmptyRuleDesignAreaSubtext")%></div>
																					</div>
																				</div>
																			</td>
																		</tr>
																	</tbody>
																</table>
															</td>
														</tr>
													</tbody>
												</table>
											</div>
										</content>
									</k3:Panel>
								</div>
							</div>
                         </div>
					</div>
				</Content>
			</k3:Pane>
		</Panes>
	</k3:PaneContainer>
	<div id="RuleSettingsDialogTemplate" style="display:none">
		<k3:Panel ID="RuleSettingsDialog" runat="server" Behavior="Fluid" Scrolling="false">
			<Header><%=GetGlobalResourceObject("RuleDesigner", "RuleSettingsPanelHeading") %></Header>
			<Content>
				<k3:FormField ID="RuleNameFF" For="RuleName" runat="server" Text="<%$ Resources:RuleDesigner, RuleSettingsName %>" Required="true">
					<k3:Textbox ID="RuleName" runat="server" Required="true" Value="" Watermark="<%$ Resources:RuleSettingsPanelNameWatermark %>" />
				</k3:FormField>
				<k3:FormField ID="RuleDescFF" For="RuleDesc" runat="server" Text="<%$ Resources:RuleDesigner, RuleSettingsDescription %>">
					<k3:TextArea ID="RuleDesc" runat="server" Value="" Watermark="<%$ Resources:RuleSettingsPanelDesscriptionWatermark %>" />
				</k3:FormField>
			</Content>
		</k3:Panel>
	</div>
	<div id="rwcommentsPopupWrapper">
		<k3:Panel runat="server" ID="rwCommentsPanel" Behavior="FullSize">
			<Content>
				<k3:TextArea ID='rwTxtComments' Watermark="<%$ Resources:Designers, EnterCommentText %>" runat="server" Height="100%" Width="100%" Rows="21"></k3:TextArea>
			</Content>
		</k3:Panel>
	</div>
	<div id="readOnlyCommentsPopupWrapper">
		<k3:Panel runat="server" ID="readOnlyCommentsPanel" Behavior="FullSize">
			<Content>
				<k3:TextArea ID='readOnlyTxtComments' ReadOnly="true" runat="server" Height="100%" Width="100%" Rows="21"></k3:TextArea>
			</Content>
		</k3:Panel>
	</div>
	<k3:HiddenField runat="server" ID="hiddenRulesXml" />
	<k3:HiddenField runat="server" ID="configuredRulesDefinitionXml" />
	<script type="text/javascript">
		/*
			SourceCode.Forms.WizardContainer.resources = {}
			This namespace is no longer used (TFS 501413), all relevant resources have been moved to Web\App_GlobalResources\RuleDesigner.resx
			Please use Resources.RuleDesigner.<ResourceKey> to access them now.
		*/
	</script>
</asp:Content>
