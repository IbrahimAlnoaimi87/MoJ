/*!
 SourceCode.Forms.Controls.Web.ManagementControlPack.AssetControl.Resources.Script.Management.js (Embedded resource)
*/
(function(n){(typeof SourceCode=="undefined"||SourceCode===null)&&(SourceCode={});(typeof SourceCode.Forms=="undefined"||SourceCode.Forms===null)&&(SourceCode.Forms={});(typeof SourceCode.Forms.Controls=="undefined"||SourceCode.Forms.Controls===null)&&(SourceCode.Forms.Controls={});(typeof SourceCode.Forms.Controls.Web=="undefined"||SourceCode.Forms.Controls.Web===null)&&(SourceCode.Forms.Controls.Web={});(typeof SourceCode.Forms.Controls.Web.Management=="undefined"||SourceCode.Forms.Controls.Web.Management===null)&&(SourceCode.Forms.Controls.Web.Management={});var t;SourceCode.Forms.Controls.Web.Management=t=n.extend({},SourceCode.Forms.Controls.Web.Management,{Initialize:function(){var f=this;n("html").hasClass("mobile")&&f.SetMobileMode();var r;r=n(".SourceCode-Forms-Controls-Web-ControlPack-TreeView").data("sfc-SFCTreeView");n(".runtime-form > .form .view .panel[name=\"Management.Main Area Item\"] .panel-body-wrapper > div > .Grid-Layout > .editor-cell[row='1'][col='1']").addClass("management-background-image");t.UserMenu();n(window).on("resize",function(){r.updateContainerHeights()});var e=n(".management .view .management-background-image");e.append('<div class="appswitcher-container hidden"><\/div>');var o=n("#appswitcher-config-div").data("appswitcherconfig"),s=t.SetWidgetValue(),q=n(".management .view .appswitcher-container");q.SFCAppSwitcher(o);var h=n(".management .view .appswitcher-container").data("sfc-SFCAppSwitcher").appSwitcherPopulate;h.populate(s);var u=n(".management .view .management-logo-container span.management-logo");n(u).on("click",function(){var r=n(this);r.hasClass("selected")?t.AppSwitcherCollapse(r,q):t.AppSwitcherExpand(r,q)});n(q).find(".appswitcher-main-close").on("click",function(){n(u).removeClass("selected")})},AppSwitcherExpand:function(n,t){n.addClass("selected");t.removeClass("hidden")},AppSwitcherCollapse:function(n,t){n.removeClass("selected");t.addClass("hidden")},FixTreeHeight:function(){var n=treeControlWidget.updateContainerHeights;treeControlWidget.updateContainerHeights=function(){var n=this.element[0].querySelector(".tree-body");n.style.height="100%"}},SetTreeScrollbar:function(){let t=n(".SFC.SourceCode-Forms-Controls-Web-ControlPack-TreeView.main div.tree-body")[0];SourceCode.Forms.Controls.Web.ControlPack.Utils.SetSimpleScrollbar(t)},InitializeGridForClick:function(){var t=n._data(n("[name='vwProcessInstanceInfo.Lis']").find(".grid-content-table")[0],"events").click;n("[name='vwProcessInstanceInfo.Lis']").find(".grid-content-table").on("click",function(){n("[name='hdlProcessInstanceListCount']").SFCLabel("option","text",n("[name='vwProcessInstanceInfo.Lis']").grid("fetch","selected-rows").length);for(var q=n("[name='vwProcessInstanceInfo.Lis']").grid("fetch","selected-rows","values"),r="",u=[],t=0;t<q.length;t++){r+=t!=0?";"+q[t][0]:q[t][0];var f=new SourceCode.Forms.Controls.Web.Management.ProcessInstanceInfo(q[t][0]);u.push(f)}n("[name='hdlProcessInstanceList']").SFCLabel("option","text",r);n("[name='hdlProcessInstanceListSerialized']").SFCLabel("option","text",JSON.stringify(u))});var q=t.pop();t.unshift(q)},RefreshParentNodeOfSelectedNode:function(){var n=parent.$(".SourceCode-Forms-Controls-Web-ControlPack-TreeView").data("sfc-SFCTreeView");var t=n.Nodes.getSelectedNode(),q=n.Nodes.getParentNode(t),r=n.Nodes.getData(q),u=r.path;n.Methods.refreshNode(u,!1)},RefreshTreeWithNewPath:function(n,t){var u=parent.$(".SourceCode-Forms-Controls-Web-ControlPack-TreeView").data("sfc-SFCTreeView");var r=u.options.pathSeparator,q=n.split(r),e=u.options.path.split(r);e.length>0&&q.length>0&&(q[0]=e[0]);var f=q.join(r);u.Methods.refreshNode(f,!1);q.push(t+",com_K2_System_Management_SmartObject_Category");f=q.join(r);parent.$(".SourceCode-Forms-Controls-Web-ControlPack-TreeView").SFCTreeView("set",f,"path")},UserMenu:function(){var q=n('.SFC.SourceCode-Forms-Controls-Web-Label[name="Welcome"]'),t=n('div.panel[name="Management.Main Area Item5"]');if(q.length>0&&t.length>0){t.attr("style","");t.find(".Grid-Layout").attr("style","");q.wrap('<div class="user-menu"><\/div>');q.closest(".user-menu").append(t);t.find(".editor-cell").on("click",function(t){t.target.tagName!=="A"&&n(this).find("a")[0].click()})}},AddFavIcon:function(n,t){var q=document.createElement("link");q.type="image/x-icon";q.rel="shortcut icon";q.href=n+"/"+t;document.getElementsByTagName("head")[0].appendChild(q)},MovePopupButtonToFooter:function(t,q){var u="";u+=!t?"":'div[name="'+t+'"] ';u+='.SFC.SourceCode-Forms-Controls-Web-Button[name="'+q+'"]';var f=n(u),e=f.closest("body"),o="Management-Site-Popup-Footer",r=e.children(".SFC."+o);r.length==0&&(r=n('<div class="SFC '+o+'"><\/div>'),e.append(r));r.append(f)},TreeContextMenu:function(){function f(){function q(n){var t=n.toLowerCase();return t=t.replace(" ","-"),'<li class="menu-action"><a href="#"><span class="menu-action-icon {0}"><\/span><span class="menu-action-text">{1}<\/span><\/li><\/a>'.format(t,n)}var t=n('<div class="tree-context-menu"><ul class="menu-actions"><\/ul><div>');return t.css("position","absolute"),t.css("width","100px"),t.css("z-index",1),t.hide(),t.find(".menu-actions").html(q("Refresh")),t}var q=n('div.panel[name="Management.Main Area Item"]'),r=n('.SFC.SourceCode-Forms-Controls-Web-ControlPack-TreeView[name="Tree"]').data("sfc-SFCTreeView"),e=q.find(".tree-body"),u=null,t=f();q.append(t);e.on("contextmenu",".node",function(r){var f=r.target,e=n(r.target),h=n(f).closest("li")[0],c=n(this).offset(),o=r.pageX,s=r.pageY-q.position().top;t.css("top",s);t.css("left",o);t.show();t.on("blur",function(){t.hide()});u=e.closest("li").get(0);r.preventDefault()});n(document).on("click",function(q){n(q.target).is(t)||t.hide()});n(".SFC.SourceCode-Forms-Controls-Web-Content-Content").on("DOMSubtreeModified",function(){var q=n(this).find(".content-control-iframe");if(q.length>0)q.on("load",function(){var r=q[0].contentDocument||q[0].contentWindow.document;n(r).on("click",function(){t.hide()})})});t.find("li.menu-action a").on("click",function(t){var q=r.Nodes.getPath(u,"id");n(this).find(".menu-action-icon").hasClass("refresh")&&r.Methods.refreshNode(q,!0);t.preventDefault()})},SetStyleAnchorClassOnDocument:function(t){n("html").addClass(t)},SetStyleAnchorClassesOnDocument:function(){if(arguments.length>0)for(var t=0;t<arguments.length;t++)n("html").addClass(arguments[t])},ApplyClassToParentView:function(t,q){var r=n('.SFC[name="'+t+'"]');r.length>0&&r.closest(".view").addClass(q)},ApplyClassToControlByName:function(t,q){var r=n('.SFC[name="'+t+'"]');r.addClass(q)},AutoSizeTableForControl:function(t,q){var u=n('.SFC[name="'+t+'"]'),r=u.closest("table");r.find("colgroup").remove();r.find("td").css("width","");typeof r[0]!="undefined"&&(r[0].style.tableLayout="auto");q&&u.closest("td").css("width","100%")},RegisterContentPanel:function(n,t){checkExists(this.contentPanelGroups)||(this.contentPanelGroups={});this.contentPanelGroups.hasOwnProperty(n)||(this.contentPanelGroups[n]=[]);for(var r=!1,q=0;q<this.contentPanelGroups[n].length;q++)this.contentPanelGroups[n][q]===t&&(r=!0);r||this.contentPanelGroups[n].push(t)},RefreshRegisteredContentPanels:function(t){var r=n('.SourceCode-Forms-Controls-Web-ControlPack-StackedContent[name="Content"]'),o=r.find("iframe:not(.hide)"),s=o.attr("data-frame-id");if(this.contentPanelGroups.hasOwnProperty(t))for(var u=this.contentPanelGroups[t],f={CurrentControlId:r.attr("id"),methodName:"RefreshPanel",methodParameters:{show:!1,load:!0}},q=0;q<u.length;q++){var e=u[q];e!==s&&(f.methodParameters.id=e,SourceCode.Forms.Controls.Web.ControlPack.StackedContent.execute(f))}},MassageParamLinks:function(){var q=n('.SourceCode-Forms-Controls-Web-DataLabel[name="dlRunDescription"]');t._AddButtonTextDescription(q);q=n('.SourceCode-Forms-Controls-Web-DataLabel[name="dlRunWithParametersDescription"]');t._AddButtonTextDescription(q);q=n('.SourceCode-Forms-Controls-Web-DataLabel[name="dlRunTestDescription"]');t._AddButtonTextDescription(q)},_AddButtonTextDescription:function(t){var r=t.text(),u=t.siblings("a").find("> span.button-c > span.button-text"),q=n("<span><\/span>",{"class":"button-text-description"});q.text(r);n(u).append(q)},GetTreeIcon:function(){var t=n(".SFC.SourceCode-Forms-Controls-Web-ControlPack-TreeView.main"),q=t.find("li.selected span.image").css("background-image"),r=n("span[name='dlBgimg']");r.SFCLabel("option","text",q)},SetServerRightsIcon:function(){var q=n("span[name='dlBgimg']"),r=q.SFCLabel("option","text"),t=n("<div><\/div>");t.css("margin-top","5px");t.css("float"," left");t.css("height"," 16px");t.css("width"," 16px");t.css("background-image",r);t.css("background-position"," 0 -512px");t.css("background-repeat"," no-repeat");var u=n("div.grid td.first div.grid-content-cell div.grid-content-cell-wrapper");u.prepend(t);var f=n("div.grid td.first div.grid-content-cell div.grid-content-cell-wrapper span.runtime-list-item");f.css("width","auto")},SetServerRightsTooltips:function(){for(var q=n("div.grid table.grid-content-table  tr"),t=0;t<q.length;t++){var r=n(q[t]).find("td").first().data("options").value;n(q[t]).find("td").eq(1).find("div.grid-content-cell-wrapper").attr("title",r)}},SetTooltips:function(t,q,r){var u=".grid";r&&(u="[name='{0}']".format(r));var f=n("div{0} table.grid-content-table  tr".format(u));f.each(function(){var r=n(this).find("td").eq(t).data("options");checkExistsNotEmpty(r)&&n(this).find("td").eq(q).find("div.grid-content-cell-wrapper").attr("title",r.value)})},SetTooltip:function(){var t=n("[name='Name Data Label']"),q=n("[name='Display Name Data Label']");q.attr("title",t.attr("title"))},SetDashboardNode:function(){var q=n('.SFC[name="lblDashboardText"]').SFCLabel("option","text"),t=n(".SFC.SourceCode-Forms-Controls-Web-ControlPack-TreeView ul.node-container.root.first > div.nodes"),r=n('<li class="node selectable populated empty dashboardNode selected " data-level="0" ><div class="content"><span class="PART-expander-clickable-area expander-container"><span class="expander"><\/span><\/span><div class="PART-header-clickable-area header"><span class="image-container show"><span class="image" ><\/span><\/span><span title="'+q+'" class="text with-image">'+q+'<\/span><\/div><\/div><div class="sfctreeview-node-container"><\/div><\/li>');r.data("data",{display:"Dashboard",source:{selectable:!0},valuePath:"/",path:"",id:"-1"});t.find("li.dashboardNode").length==0&&(t.find("li").removeClass("focus selected"),t.prepend(r))},SetListViewIcon:function(t){console.warn(t);var f=n("[name={0}]".format(t)),r=n.parseXML(f.SFCLabel("option","text"));console.warn(r);var u=r.selectSingleNode("/collection/object/fields/field[@name='FileRequestData']/value").text;console.warn(u);var q=n("<div><\/div>");q.css("margin-top","5px");q.css("float"," left");q.css("height"," 16px");q.css("width"," 16px");q.css("background-image","url(data:image/png;base64,"+u+")");q.css("background-position"," 0 -512px");q.css("background-repeat"," no-repeat");var e=n("div.grid td.first div.grid-content-cell div.grid-content-cell-wrapper");e.prepend(q)},SetSelectiveIcon:function(t,q,r,u){if(!t||!q){console.warn("SetSelectiveIcon missing params!");return}r||(r=".grid-content-table");u||(u="tbody td:nth-of-type(1)");var f=n("<div><\/div>",{"class":q.replace(/\./g," ")});document.body.appendChild(f.get(0));var s=f.css("background-image");document.body.removeChild(f.get(0));var e=document.createElement("style");e.type="text/css";e.innerHTML=" .tempIcon "+u+" { background-image: "+s+" !important; background-repeat: no-repeat; background-position: 1px 6px; padding-left: 15px !important; background-size: 16px; }";document.getElementsByTagName("head")[0].appendChild(e);var o=n('div[name="'+t+'"] '+r);o.length>0&&o.addClass("tempIcon")},SetDynamicIcon:function(t,q,r,u){if(!t||!u||!r){console.warn("SetSelectiveIcon missing params!");return}var h="tempIconClass"+t.replace(/[\s\.]/g,"");q||(q=".grid-content-table");var o=n('div[name="'+t+'"] '+q);n(document.getElementsByTagName("head")[0]).find("style[id="+h+"]").remove();var e=n("<style><\/style>");e.attr("type","text/css");e.attr("id",h);for(var c=o.find("tr"),f=0;f<c.length;f++){var l=n(c[f]).find(r.replace("#",f));if(l.length!==0){var a=l.text();if(a.trim().length!==0){var s=n("<div><\/div>",{"class":a.replace(/\./g," ")});document.body.appendChild(s.get(0));var v=s.css("background-image");document.body.removeChild(s.get(0));e.append(" .tempIcon "+u.replace("#",f+1)+" { background-image: "+v+" !important; background-repeat: no-repeat; background-position: 3px 6px; padding-left: 20px !important; background-size: 16px; }")}}}document.getElementsByTagName("head")[0].appendChild(e.get(0));o.length>0&&o.addClass("tempIcon")},SetMobileMode:function(){[/Android/i,/webOS/i,/iPhone/i,/iPad/i,/iPod/i,/BlackBerry/i,/Windows Phone/i].some(t=>{if(navigator.userAgent.match(t)){var q=n("div.runtime-content > div.runtime-form.theme-entry");q.addClass("hide-for-mobile");var r=n('<div class="mobile-mode"><table class="mobile-selection"><tr><td><table class="mobile-title-region"><tr><td class="mobile-mode-logo"><\/td><td><span class="mobile-title">Management<\/span><\/td><\/tr><\/table><\/td><\/tr><tr><td><div class="mobile-text">Download the app for your device.<\/div><\/td><\/tr><tr><td><table class="mobile-app-table"><tr><td ><div class="mobile-bullit-container"><\/div><\/td><td><span class="mobile-title">Apple (iOS)<\/span><\/td><\/tr><tr><td ><div class="mobile-bullit-container"><\/div><\/td><td><span class="mobile-title">Android<\/span><\/td><\/tr><tr><td ><div class="mobile-bullit-container"><\/div><\/td><td><span class="mobile-title">Windows<\/span><\/td><\/tr><\/table><\/td><\/tr><\/table><\/div>'),u=n("div.runtime-content");u.append(r)}})},RestrictDropDownHeightToBody:function(){n("select.input-control").data("ui-dropdown")._calculateAvailableHeight=SourceCode.Forms.Controls.DropDown._calculateAvailableHeight=function(){var t=this.control.offset().top-n(document).scrollTop(),q=SourceCode.Forms.Widget.getBoxShadow(this.dropdown),r=n("body").height()-t-this.control.height()-q.vShadow-q.spread;return t>r?{position:"above",height:parseInt(t)-this.popupVerticalOffsetFromControl}:{position:"below",height:parseInt(r)-this.popupVerticalOffsetFromControl}}},SetLabelValue:function(t,q){n('[name="'+t+'"]').SFCLabel("option","text",q)},GetLabelValue:function(t){return n('[name="'+t+'"]').SFCLabel("option","text")},RemoveObjectFromJsonArray:function(n,t,q){for(i=0;i<n.length;i++)if(n[i][t]==q)return n.splice(i,1),n;return n},UpdateJsonArray:function(n,q,r,u){if(u.length>0)if(q.length>0&&r.length>0&&typeof n=="string")try{var f=n.replace(/\\/g,"\\\\");f=JSON.parse(f);f=JSON.stringify(t.RemoveObjectFromJsonArray(f,q,r));t.SetLabelValue(u,f)}catch(e){t.SetLabelValue(u,n);return}else{t.SetLabelValue(u,n);return}},SetWidgetValue:function(){return{options:{serverControlType:"SOURCECODE FORMS CONTROLS WEB MANAGEMENTCONTROLPACK ASSETCONTROL"},base:{_booleanConverter:function(n){return["true","yes","1"].contains((n+"").toLowerCase())}},navigationResources:{LoadMore:"Load More"}}},FindLastIndex:function(n,q,r){var u=n.lastIndexOf(q);t.SetLabelValue(r,u)}});n(document).ready(function(){if(!!n.sfc.SFCTreeView){var r=n.sfc.SFCTreeView.prototype._create;n.sfc.SFCTreeView.prototype._create=function(){this.element.attr("name")==="Tree"&&(treeControlWidget=this,treeControl=this.element,t.FixTreeHeight(),t.TreeContextMenu());r.call(this)}}SourceCode.Forms.Controls.Web.Management.ProcessInstanceInfo=function(n){this.ProcInstID=n;this.StartDate="0001-01-01T00:00:00";this.Version=0;this.ProcSetId=0};SourceCode.Forms.Controls.Web.Management.ProcessInstanceInfo.prototype={Folio:null,Originator:null,OriginatorDisplayName:null,ProcID:null,ProcInstID:null,StartDate:null,Status:null,Version:null,ProcessFullName:null,ProcSetId:null};n("[name='Process.Main Area Item2']").find(".grid-content-table").on("click",function(){n("[name='hdlProcessInstanceListCount']").SFCLabel("option","text",n("[name='Process.Main Area Item2']").grid("fetch","selected-rows").length);for(var q=n("[name='Process.Main Area Item2']").grid("fetch","selected-rows","values"),r="",u=[],t=0;t<q.length;t++){r+=t!=0?";"+q[t][0]:q[t][0];var f=new SourceCode.Forms.Controls.Web.Management.ProcessInstanceInfo(q[t][0]);u.push(f)}n("[name='hdlProcessInstanceList']").SFCLabel("option","text",r);n("[name='hdlProcessInstanceListSerialized']").SFCLabel("option","text",JSON.stringify(u))});n("[name='ProcessSet.Main Area Item2']").find(".grid-content-table").on("click",function(){n("[name='hdlProcessInstanceListCount']").SFCLabel("option","text",n("[name = 'ProcessSet.Main Area Item2']").grid("fetch","selected-rows").length);for(var q=n("[name = 'ProcessSet.Main Area Item2']").grid("fetch","selected-rows","values"),r="",u=[],t=0;t<q.length;t++){r+=t!=0?";"+q[t][0]:q[t][0];var f=new SourceCode.Forms.Controls.Web.Management.ProcessInstanceInfo(q[t][0]);u.push(f)}n("[name='hdlProcessInstanceList']").SFCLabel("option","text",r);n("[name='hdlProcessInstanceListSerialized']").SFCLabel("option","text",JSON.stringify(u))});n(".usercard-link").on("click",function(){n(".SourceCode-Forms-Controls-Web-ControlPack-UserCard").trigger("click")});n(".SourceCode-Forms-Controls-Web-ControlPack-UserCard, .PART-linktext.PART-link-clickarea.usercard-text.usercard-link").on("click",function(t){if(n(".userCardHelpLogOut").length>1){n(".userCardHelpLogOut").remove();return}if(n("body").append("<div class='userCardHelpLogOut'><div tabindex='0' class='partClick help'><span>Help<\/span><\/div><div tabindex='0' class='partClick logout'><span>Logout<\/span><\/div><\/div>"),n(".userCardHelpLogOut").length>1){n(".userCardHelpLogOut").eq(1).remove();return}n(".userCardHelpLogOut").fadeIn();var q=n(".PART-linktext.PART-link-clickarea.usercard-text.usercard-link").offset(),r=n(".userCardHelpLogOut").width()/2-n(".PART-linktext.PART-link-clickarea.usercard-text.usercard-link").width()/2;n(".userCardHelpLogOut").offset({left:q.left-r,top:q.top-75});n(".userCardHelpLogOut").on("click",".partClick.help",function(){n(".userCardHelpLogOut").remove();var t="https://"+document.domain+"/runtime/help.aspx?ID=1001";window.open(t,"_blank")});n(".userCardHelpLogOut").on("click",".partClick.logout",function(){n(".userCardHelpLogOut").remove();var t=SourceCode.Forms.SessionManagement.Session.logouturl;window.location.href=t+(t.indexOf("?")>=0?"&":"?")+n.param({ReturnURL:window.location.href})});n("body").on("click",function(){n(".userCardHelpLogOut").remove()});t.stopPropagation()});n("body").on("click",".userCardHelpLogOut",function(n){n.stopPropagation()});var q=SourceCode.Forms.SessionManagement.Session.logouturl;if(typeof q!="undefined"||q!=null){var u=q+(q.indexOf("?")>=0?"&":"?")+n.param({ReturnURL:window.location.href});n(".hlLoginAsDifferentUser").attr("href",u)}})})(jQuery);
/*!
 SourceCode.Forms.Controls.Web.ManagementControlPack.AssetControl.Resources.Script.Management.Features.General.js (Embedded resource)
*/
(function(n){(typeof SourceCode=="undefined"||SourceCode===null)&&(SourceCode={});(typeof SourceCode.Forms=="undefined"||SourceCode.Forms===null)&&(SourceCode.Forms={});(typeof SourceCode.Forms.Controls=="undefined"||SourceCode.Forms.Controls===null)&&(SourceCode.Forms.Controls={});(typeof SourceCode.Forms.Controls.Web=="undefined"||SourceCode.Forms.Controls.Web===null)&&(SourceCode.Forms.Controls.Web={});(typeof SourceCode.Forms.Controls.Web.Management=="undefined"||SourceCode.Forms.Controls.Web.Management===null)&&(SourceCode.Forms.Controls.Web.Management={});(typeof SourceCode.Forms.Controls.Web.Management.Features=="undefined"||SourceCode.Forms.Controls.Web.Management.Features===null)&&(SourceCode.Forms.Controls.Web.Management.Features={});(typeof SourceCode.Forms.Controls.Web.Management.Features.General=="undefined"||SourceCode.Forms.Controls.Web.Management.Features.General===null)&&(SourceCode.Forms.Controls.Web.Management.Features.General={});var t;SourceCode.Forms.Controls.Web.Management.Features.General=t=n.extend({},SourceCode.Forms.Controls.Web.Management.Features.General,{initialize:function(){let t=n("html.management.features-general body");t.find(".row").eq(0).addClass("details");t.find(".row").eq(1).addClass("activation")},moveLabelToFooter:function(t){let r=n("html.management.features-general body"),f=r.find('.SFC.SourceCode-Forms-Controls-Web-DataLabel[Name="'+t+'"]'),u="Management-Site-Popup-Footer",q=r.find(".SFC."+u);q.length===0&&(q=n('<div class="SFC '+u+'"><\/div>'),r.append(q));q.append(f)},setStepState:function(t,q){let u=n("html.management.features-general body"),r=["active","complete","attention","error","ready"];if(r.indexOf(q)>=0){r.splice(n.inArray(q,r),1);let f=u.find(".row.activation .activation-step."+t).parent();if(f.length>0){for(let n=0;n<r.length;n++)f.toggleClass(r[n],!1);f.toggleClass(q,!0);q==="attention"&&SourceCode.Forms.Controls.Web.Management.Features.General.moveRetryButtons(u,f)}}},moveRetryButtons:function(n,t){let q=t.find(".step-buttons");if(q.length>0){let t=n.find('.row.activation .SFC.SourceCode-Forms-Controls-Web-Button[Name="btnReopen"]'),r=n.find('.row.activation .SFC.SourceCode-Forms-Controls-Web-Button[Name="btnContinue"]');q.append(t.toggleClass("hidden",!1));q.append(r.toggleClass("hidden",!1))}}})})(jQuery);
/*!
 SourceCode.Forms.Controls.Web.ManagementControlPack.AssetControl.Resources.Script.Management.Features.SharePointSiteCollection.js (Embedded resource)
*/
(function(n){(typeof SourceCode=="undefined"||SourceCode===null)&&(SourceCode={});(typeof SourceCode.Forms=="undefined"||SourceCode.Forms===null)&&(SourceCode.Forms={});(typeof SourceCode.Forms.Controls=="undefined"||SourceCode.Forms.Controls===null)&&(SourceCode.Forms.Controls={});(typeof SourceCode.Forms.Controls.Web=="undefined"||SourceCode.Forms.Controls.Web===null)&&(SourceCode.Forms.Controls.Web={});(typeof SourceCode.Forms.Controls.Web.Management=="undefined"||SourceCode.Forms.Controls.Web.Management===null)&&(SourceCode.Forms.Controls.Web.Management={});(typeof SourceCode.Forms.Controls.Web.Management.Features=="undefined"||SourceCode.Forms.Controls.Web.Management.Features===null)&&(SourceCode.Forms.Controls.Web.Management.Features={});(typeof SourceCode.Forms.Controls.Web.Management.Features.SharePointSiteCollection=="undefined"||SourceCode.Forms.Controls.Web.Management.Features.SharePointSiteCollection===null)&&(SourceCode.Forms.Controls.Web.Management.Features.SharePointSiteCollection={});var t;SourceCode.Forms.Controls.Web.Management.Features.SharePointSiteCollection=t=n.extend({},SourceCode.Forms.Controls.Web.Management.Features.General,{initialize:function(){SourceCode.Forms.Controls.Web.Management.Features.General.initialize();let t=n("html.management.features-sharepoint-sitecollection body");t.find(".row").eq(2).addClass("list");t.find(".row").eq(3).addClass("list-controls");t.find('.SFC.SourceCode-Forms-Controls-Web-Button[Name="btnAdd"]').addClass("blue");t.find('.SFC.SourceCode-Forms-Controls-Web-Button[Name="btnDone"]').addClass("blue");t.find('.SFC.SourceCode-Forms-Controls-Web-Button[Name="btnActivate"]').addClass("blue");t.find('.SFC.SourceCode-Forms-Controls-Web-Button[Name="btnRetry"]').addClass("blue");let q=t.find(".row.list .grid-body .grid-body-content");SourceCode.Forms.Controls.Web.Management.SetCustomScrollbar(q)},getBaseUrl:function(n,t){if(typeof n!="undefined"&&typeof t!="undefined"){var q=new URL(n);SourceCode.Forms.Controls.Web.Management.SetLabelValue(t,q.protocol+"//"+q.host+"/")}},getSettingKey:function(n,t,q){try{if(typeof n=="string"&&typeof t!="undefined"&&typeof q!="undefined"){var r=n.replace(/\\/g,"\\\\");for(r=JSON.parse(r),i=0;i<r.length;i++)if(r[i].Name===t){SourceCode.Forms.Controls.Web.Management.SetLabelValue(q,r[i].Value);return}}else{SourceCode.Forms.Controls.Web.Management.SetLabelValue(q,"");return}}catch(u){SourceCode.Forms.Controls.Web.Management.SetLabelValue(q,"");return}},setSettingKey:function(n,t,q,r){try{if(typeof n=="string"&&typeof t!="undefined"&&typeof q!="undefined"&&typeof r!="undefined"){var u=n.replace(/\\/g,"\\\\");for(u=JSON.parse(u),i=0;i<u.length;i++)if(u[i].Name===t){u[i].Value=q;break}SourceCode.Forms.Controls.Web.Management.SetLabelValue(r,JSON.stringify(u));return}SourceCode.Forms.Controls.Web.Management.SetLabelValue(r,"");return}catch(f){SourceCode.Forms.Controls.Web.Management.SetLabelValue(r,"");return}}})})(jQuery);
