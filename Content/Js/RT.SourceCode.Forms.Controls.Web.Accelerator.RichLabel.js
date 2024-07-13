/*!
 SourceCode.Forms.Controls.Web.Accelerator.Scripts.RichLabelBehavior.js (Embedded resource)
*/
(function(n){n.widget("sfc.SFCAcceleratorRichLabel",n.sfc.extendedWidget,{options:{width:"",toolTip:"",valueToolTip:!0,wrapText:"",literalVal:"",text:"",style:SourceCode.Forms.Controls.Base.emptyStylesNode,defaultValue:"",previous:{},controlWrapper:!1,controlWrapperClassName:"label-dimensions-wrapper",emptyValue:"",more:"",rows:3,isExpanded:!1},controlValueAccessor:"html",_create:function(){var t=this,q=this.element[0].getAttribute("title");checkExists(q)&&(this.options.toolTip=q);this.options.wrapText=this.element.hasClass("richLabelWrap");this.options.literalVal===""?this.options.literalVal=!0:this.controlValueAccessor="text";this.options.defaultValue=this.options.text;this.options.width=this.element[0].style.width;this._applyControlWrapper();this.base._create.apply(this,arguments);this.setRows(this.options.rows);n(window).on("resize",function(){t.options.isExpanded||t.setRows(t.options.rows)});return this},applyChanges:function(){if((this.options.previous.style!==this.options.style||this.options.previous.width!==this.options.width)&&this._applyControlWrapper(),this.options.previous.width!==this.options.width){var u=this.getDimensionsElement()[0],t=this.options.width;if(this.options.width===""||this.options.width==="auto")u.style.width="auto";else{var f=t.indexOf("%")===-1?"px":"%";t=t.toLowerCase().replaceAll("px","").replaceAll("%","");t=isNaN(parseInt(t))?parseFloat(t):parseInt(t);isNaN(t)||(u.style.width=t+f)}}if(this.options.previous.style!==this.options.style&&this.options.style!==""){var e={border:this.element,background:this.element,margin:this.element,padding:this.element},q=this.element.find(".content"),o={background:q,font:q,horizontalAlign:q};StyleHelper.setStyles(e,this.options.style);StyleHelper.setStyles(o,this.options.style);this.setRows(this.options.rows)}if(this.literalUpdate(),this.options.previous.toolTip!==this.options.toolTip){var r=this.options.toolTip;r===""?(r=this.element.text(),this.options.valueToolTip=!0):this.options.valueToolTip=!1;this.element[0].setAttribute("title",r)}this.options.previous.wrapText!==this.options.wrapText&&(this.element.toggleClass("richLabelWrap",this.options.wrapText===!0),this.element.find(".content").toggleClass("richLabelWrap",this.options.wrapText===!0));this.element.hasClass("SourceCode-Forms-Controls-Web-Accelerator-RichLabel")?this.base.applyChanges.apply(this,arguments):(this.options.previous.text!==this.options.text&&this._value(this.options.text),n.sfc.baseWidget.prototype.applyChanges.apply(this,arguments));this.element.hasClass("designtime")&&this.options.text===""&&this.options.previous.emptyValue!==this.options.emptyValue&&this._value("");(this.options.previous.rows!==this.options.rows||this.options.previous.more!==this.options.more)&&this.setRows(this.options.rows)},literalUpdate:function(){this.options.previous.literalVal!==this.options.literalVal&&(this.controlValueAccessor=this.options.literalVal===!0?"html":"text",this._value(this.options.text))},_value:function(n){var t;if(checkExists(n)){if(this.element.toggleClass("empty",n===""),this.element.hasClass("designtime")&&(n===""&&(n=this.options.emptyValue),this.options.literalVal===!0&&(n=n.stripScripts())),t=this.base._value.apply(this,arguments),this.options.valueToolTip===!0){var q=this.element.text();this.element[0].setAttribute("title",q)}}else t=this.base._value.apply(this,arguments);return this.setRows(this.options.rows),t},_getInnerControl:function(){return this.element.find(".content")},_updateDisplayValue:function(n){var r=this._getInnerControl(),f=this._getInnerControl(),q=this.options[this.optionsValueName];checkExists(n)&&n===!0&&(t={formatXmlString:this.options.format,value:q,ignoreDates:!0,doSimpleReplace:!0,dataType:this.options.dataType},q=SCCultureHelper.Current().getEditableValue(t));var t={formatXmlString:this.options.format,elementToStyle:r,value:q,formattingError:!1,valueIsEditableValue:n,dataType:this.options.dataType},u=SCCultureHelper.Current().applyFormatToControlValue(t);t.value!==q&&(this.options[this.optionsValueName]=t.value);this._value(u)},validate:function(){this.element.hasClass("SourceCode-Forms-Controls-Web-Accelerator-RichLabel")&&this.base.validate.apply(this,arguments)},addPlaceHolder:function(){var q=this,t=q.element.find(".content > .placeHolder");return t.length===0&&(t=n("<span><\/span>",{"class":"placeHolder"}),q.element.find(".content").append(t)),t},setRows:function(t){var q=this,r=n("<div><\/div>",{text:"."});q.element.find(".content").append(r);var u=parseInt(r.css("height"));r.remove();var f=u*parseInt(t),e=f+parseInt(q.element.css("padding-top"))+parseInt(q.element.css("padding-bottom"));q.options.more.length>0&&(e+=u);q.element.css("height",e+"px");q.element.find(".content").css("height",f+"px");q.setMore(q.options.more,u)},setMore:function(t,q){var r=this,o=r.addPlaceHolder();if(Math.ceil(o.position().top)>=r.element.find(".content").height()&&!r.options.isExpanded){var u=r.element.find(".moreContent");if(u.length===0){u=n("<div><\/div>",{"class":"moreContent"});var s=n("<div><\/div>",{"class":"elipsis",bottom:r.element.css("padding-bottom"),right:r.element.css("padding-right"),"background-color":r.element.css("background-color"),text:"...",click:function(n){r.moreClicked(n)}});u.append(s);var h=n("<div><\/div>",{"class":"moreElement",bottom:r.element.css("padding-bottom"),right:r.element.css("padding-right"),"background-color":r.element.css("background-color"),text:t,click:function(n){r.moreClicked(n)}});r.element.append(h);r.element.find(".content").append(u)}if(r.options.previous.more!==r.options.more&&r.element.find(".moreElement").text(r.options.more),r.element.css("background-color")==="rgba(0, 0, 0, 0)"){for(var e=u.parents(),f=0;f<e.length;f++)if(n(e[f]).css("background-color")!=="rgba(0, 0, 0, 0)"){u.css("background",n(e[f]).css("background"));break}}else u.css("background",r.element.css("background")),SourceCode.Forms.Browser.msie&&u.css("background-color",r.element.css("background-color"))}else r.element.find(".moreContent").remove(),r.element.find(".moreElement").remove(),q&&r.options.more.length>0&&r.element.css("height",parseInt(r.element.css("height"))-q)},moreClicked:function(){this.element.hasClass("designtime")||this.element.hasClass("preview")||this.options.isReadOnly||!this.options.isEnabled||(this.element.css("height","auto"),this.element.find(".content").css("height","auto"),this.setMore(),this.options.isExpanded=!0,this.element.find(".moreContent").remove(),this.element.find(".moreElement").remove())},trimText:function(n){for(var t=this,r=t.addPlaceHolder(),f=!1,q=n.length,u=n.length,e=t.element.find(".moreContent").length>0;!f;)t.element.find(".content").text(n.substr(0,u)),t.setMore(t.options.more,e),r.position().left>t.element.find(".moreContent").position().left?(q=q/2,u-=q):r.position().left<t.element.find(".moreContent").position().left&&r.position().left+3>t.element.find(".moreContent").position().left||q<=2?f=!0:(q=q/2,u+=q)}});n.sfc.SFCAcceleratorRichLabel.prototype.base=n.sfc.extendedWidget.prototype;n(document).ready(function(){n(".SFC.SourceCode-Forms-Controls-Web-Accelerator-RichLabel, .SFC.SourceCode-Forms-Controls-Web-Accelerator-RichLabel").each(function(t,q){n(q).SFCAcceleratorRichLabel()})})})(jQuery);
/*!
 SourceCode.Forms.Controls.Web.Accelerator.Scripts.RichLabelType.js (Embedded resource)
*/
(function(n){(typeof SourceCode=="undefined"||SourceCode===null)&&(SourceCode={});(typeof SourceCode.Forms=="undefined"||SourceCode.Forms===null)&&(SourceCode.Forms={});(typeof SourceCode.Forms.Controls=="undefined"||SourceCode.Forms.Controls===null)&&(SourceCode.Forms.Controls={});(typeof SourceCode.Forms.Controls.Web=="undefined"||SourceCode.Forms.Controls.Web===null)&&(SourceCode.Forms.Controls.Web={});(typeof SourceCode.Forms.Controls.Web.Accelerator=="undefined"||SourceCode.Forms.Controls.Web.Accelerator===null)&&(SourceCode.Forms.Controls.Web.Accelerator={});var t;SourceCode.Forms.Controls.Web.Accelerator.RichLabel=t=n.extend({},SourceCode.Forms.Controls.Base.ControlType,{_getInstance:function(t){var q=n("#"+t);if(q.length===0)throw"Control not found";else return q},getProperty:function(n){var q=t._getInstance(n.CurrentControlId),r=q.SFCAcceleratorRichLabel("option",n.property);if(r!==q)return r},setProperty:function(n){t._getInstance(n.CurrentControlId).SFCAcceleratorRichLabel("option",n.property,n.Value)},setValue:function(n){t._getInstance(n.CurrentControlId).SFCAcceleratorRichLabel("option","text",n.Value)},getValue:function(n){var q=t._getInstance(n.CurrentControlId),r=q.SFCAcceleratorRichLabel("option","text");if(r!==q)return r},getDefaultValue:function(n){var q=t._getInstance(n.CurrentControlId),r=q.SFCAcceleratorRichLabel("option","defaultvalue");if(r!==q)return r},setStyles:function(n,q){n.find(".SFC").SFCAcceleratorRichLabel().SFCAcceleratorRichLabel("option","style",q.xml);var e=n.hasClass("form-control"),r=n.data("controlid");checkExists(r)||(r=n.attr("id"));var u=e?SourceCode.Forms.Designers.Form.Styles._getControlNode(r):SourceCode.Forms.Designers.View.Styles._getControlNode(r);var f=u.selectSingleNode('.//Properties/Property[Name/text()="Width"]/Value'),o=checkExists(f)?f.text:"",s=u.xml;t.setWidth(n,o,s)},setWidth:function(n,q){var r=n.find(".SFC").SFCAcceleratorRichLabel();r.SFCAcceleratorRichLabel("option","width",q);var u=r.SFCAcceleratorRichLabel("getDimensionsElement");t.base.setWidth(n,u,q)},setText:function(n,t){n.find(".SFC").SFCAcceleratorRichLabel().SFCAcceleratorRichLabel("option","text",t)},setWrapText:function(n,t){n.find(".SFC").SFCAcceleratorRichLabel().SFCAcceleratorRichLabel("option","wraptext",t)},setLiteralVal:function(n,t){n.find(".SFC").SFCAcceleratorRichLabel().SFCAcceleratorRichLabel("option","literalval",t)},setControlName:function(n,t){n.find(".SFC").SFCAcceleratorRichLabel().SFCAcceleratorRichLabel("option","emptyvalue","["+t+"]")},setToolTip:function(n,t){n.find(".SFC").SFCAcceleratorRichLabel().SFCAcceleratorRichLabel("option","toolTip",t)},validate:function(n){t._getInstance(n.CurrentControlId).SFCAcceleratorRichLabel("validate",n)},setMore:function(n,t){n.find(".SFC").SFCAcceleratorRichLabel().SFCAcceleratorRichLabel("option","more",t)},setRows:function(n,t){n.find(".SFC").SFCAcceleratorRichLabel().SFCAcceleratorRichLabel("option","rows",t)}})})(jQuery);
