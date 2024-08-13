/* global checkExists: false */
/* global rangy: false */
(function ($)
{

	$.widget("k2.tokenbox", {

		options: {
			accept: ".token",
			droppableEnabled: true,
			multiValue: true,
			multiline: false,
			allowTextInput: true,
			change: null,
			watermark: '',
			required: false,
			active: false,
			wysiwyg: {
				enabled: false,
				commands: {
					fontName: { visible: true },
					fontSize: { visible: true },

					bold: { visible: true },
					italic: { visible: true },
					underline: { visible: true },
					strikeThrough: { visible: false },

					fontColor: { visible: true },

					justifyLeft: { visible: true },
					justifyCenter: { visible: true },
					justifyRight: { visible: true },
					justifyFull: { visible: false },

					indent: { visible: false },
					outdent: { visible: false },

					subscript: { visible: false },
					superscript: { visible: false },

					insertOrderedList: { visible: false },
					insertUnorderedList: { visible: false },
					insertHorizontalRule: { visible: false },

					cut: { visible: false },
					copy: { visible: false },
					paste: { visible: false },
					html: { visible: false },

					highlight: { visible: true },

					clear: { visible: true },

					loadTemplate: { visible: false },
					clearTemplate: { visible: false }
				},
				fonts: ["Arial", "Bookman Old Style", "Comic Sans MS", "Courier", "Courier New", "Garamond", "Georgia", "Impact", "Lucida Console",
					"Lucida Sans Unicode", "MS Sans Serif", "MS Serif", "Palatino Linotype", "Sans Serif", "Serif", "Tahoma", "Times New Roman",
					"Trebuchet MS", "Verdana"],
				fontSizes: ["8pt", "9pt", "10pt", "11pt", "12pt", "14pt", "16pt", "18pt", "20pt", "22pt", "24pt", "26pt", "28pt", "36pt", "48pt", "72pt"],
				watermark: ''
			}
		},

		regexp: {
			rp: /<p>/gim,				// paragraph start tags
			rpe: /<\/p>/gim,			// paragraph end tags
			rd: /<div>/gim, 			// div start tags
			rde: /<\/div>/gim,			// div end tags
			rb: /<br.*?>/gim,			// br tags
			rls: /^[ \t]+/gm,			// leading space & tabs
			rts: /[ \t]+$/gm,			// trailing space & tabs
			rlsc: /^\s/,				// leading space chars
			rtsc: /\s$/,				// trailing space chars
			formatBR: /<br>/gim,			//match for replace with <br />
			formatOpeningSpan: /<SPAN/gim,		//match for replace with <span
			formatClosingSpan: /<\/SPAN>/gim,	//match for replace with </span>
			zeroWidthSpace: /\u200B/g,		// match zero-width-space characters
			nonBreakSpace: /\u00A0/g,		// match non-breaking-space characters
			lineBreak: /<\/div><div>/gim		// div end tags with immediate div start tag
		},

		_create: function ()
		{

			this.control = $(this._html()).insertAfter(this.element);
			this.element.hide();

			this.editor = this.control.find("*[contenteditable=true]");

			if (this.options.watermark !== '' && !this.editor.text().length)
				this.control.find(".input-control-content").append("<span class=\"token-input-watermark\">" + this.options.watermark + "</span>");

			this.control.find("select").dropdown({ width: "inherit" });
			this.control.find(".toolbar-button").on("click.tokenbox", this._toolbarClick.bind(this));

			if (!this.options.multiline) this.control.addClass("single-line");

			this.draggable = null;

			this.deleteCodes = [8, 46]; // Backspace & Delete

			this.controlcodes = [
				9, 16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 44, 45, 91, 92, 93,
				112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 144, 145, 182, 183
			];

			this._initEditorEvents();

			// Purely to assist debugging, has no functional value
			this.control.addClass((!this.options.multiValue) ? "single-value" : "multi-value");
			this.control.addClass((!this.options.allowTextInput) ? "tokens-only" : "mixed-values");
		},

		_destroy: function ()
        {
            this.control.remove();
            this.element.show();
		},

		_disableEditor: function ()
		{
			this.editor.prop("contenteditable", false);
		},

		_disableSpellCheck: function ()
		{
			this.editor.prop("spellcheck", false);
		},

		_enableEditor: function ()
		{
			this.editor.prop("contenteditable", true);
		},

		_enableSpellCheck: function ()
		{
			this.editor.prop("spellcheck", true);
		},

		_execCommand: function (command, useui, arg)
		{
			return document.execCommand(command, useui, arg);
		},

		_html: function ()
		{

			var htmlstr = "";

			if (this.options.wysiwyg.enabled)
			{
				htmlstr = "<div class=\"panel full without-header with-toolbar without-footer scroll-contents token-input\">"
					+ "<div class=\"panel-toolbars\"><div class=\"toolbars single\"><div class=\"toolbar\"><div class=\"toolbar-wrapper\">";

				var i = 0;

				var self = this;

				$.each(this.options.wysiwyg.commands, function (key, val)
				{
					if (val.visible)
					{
						if (i > 0) htmlstr += "<div class=\"toolbar-divider\"></div>";

						i++;

						switch (key)
						{
							case "fontName":
								htmlstr += "<div class=\"toolbar-control-wrapper\"><select>"
									+ "<option class=\"\" value=\"unchanged\" selected=\"selected\"></option>";

								for (var j = 0, l = self.options.wysiwyg.fonts.length; j < l; j++)
									htmlstr += "<option class=\"font-family-" + (self.options.wysiwyg.fonts[j].toLowerCase().replaceAll(" ", "-"))
										+ "\" value=\"" + self.options.wysiwyg.fonts[j] + "\">" + self.options.wysiwyg.fonts[j] + "</option>";

								htmlstr += "<option value=\"\">Clear</option></select></div>";
								break;
							case "fontSize":
								htmlstr += "<div class=\"toolbar-control-wrapper\"><select><option value=\"unchanged\"></option>";

								for (var j = 0, l = self.options.wysiwyg.fontSizes.length; j < l; j++)
									htmlstr += "<option value=\"" + self.options.wysiwyg.fontSizes[j] + "\">" + self.options.wysiwyg.fontSizes[j] + "</option>";

								htmlstr += "<option value=\"\">Clear</option></select></div>";
								break;
							default:
								var icon = key;

								switch (key)
								{
									case "justifyLeft":
										icon = "justify-left";
										break;
									case "justifyCenter":
										icon = "justify-center";
										break;
									case "justifyRight":
										icon = "justify-right";
										break;
									case "justifyFull":
										icon = "justify-full";
										break;
									case "fontColor":
										icon = "text-color";
										break;
									case "highlight":
										icon = "text-highlight";
										break;
									case "loadTemplate":
										icon = "load-template";
										break;
									case "clearTemplate":
										icon = "clear-template";
										break;
								}

								htmlstr += "<a class=\"toolbar-button " + icon + "\" href=\"javascript:;\" command=\"" + key + "\"><span class=\"button-l\"></span>"
									+ "<span class=\"button-c\"><span class=\"button-icon\"></span></span><span class=\"button-r\"></span></a>";
						}

					}
				});

				htmlstr += "</div></div></div></div>"
					+ "<div class=\"panel-body\"><div class=\"panel-body-t\"><div class=\"panel-body-t-l\"></div><div class=\"panel-body-t-c\">"
					+ "</div><div class=\"panel-body-t-r\"></div></div><div class=\"panel-body-m\"><div class=\"panel-body-m-l\">"
					+ "</div><div class=\"panel-body-m-c\"><div class=\"panel-body-wrapper\"><div class=\"scroll-wrapper\">"
					+ "<div class=\"token-input-editor-area\" contenteditable=\"true\">" + self.element.val() + "</div></div></div></div>"
					+ "<div class=\"panel-body-m-r\"></div></div><div class=\"panel-body-b\"><div class=\"panel-body-b-l\"></div>"
					+ "<div class=\"panel-body-b-c\"></div><div class=\"panel-body-b-r\"></div></div></div></div>";
			}
			else
			{
				htmlstr = "<div class=\"input-control token-input\"><div class=\"input-control-content\"><div class=\"input-control-wrapper\">"
					+ "<div class=\"token-input-editor-area\" contenteditable=\"true\">" + this.element.val() + "</div></div>"
					+ "</div></div>";
			}

			return htmlstr;

		},

		_initEditorEvents: function ()
		{
			var self = this;

			// Keystroke Handling
			self.editor.on("keydown.tokenbox", function (ev)
			{
				// Disable the Enter key for single line tokenboxes
				if (!self.options.multiline && ev.keyCode === 13) return false;

				// Disabling styling shortcut keys for non-wysiwyg tokenboxes
				if (!self.options.wysiwyg.enabled && ev.ctrlKey && [66, 69, 73, 74, 76, 82, 85, 107, 188, 190].indexOf(ev.keyCode) !== -1) return false;

				// Blocking user keyboard input if free text is not allowed (control codes should work however)
				if (!self.options.allowTextInput && self.deleteCodes.indexOf(ev.keyCode) === -1 && self.controlcodes.indexOf(ev.keyCode) === -1)
				{
					return false;
				}

				// Main keystroke handling
				var sel = rangy.getSelection(), range = (sel.rangeCount > 0) ? sel.getRangeAt(0) : rangy.createRange();
				var startContainer = range.startContainer, startOffset = range.startOffset, endContainer = range.endContainer, endOffset = range.endOffset;

				// Single value keystroke handling
				if (!self.options.multiValue && self.controlcodes.indexOf(ev.keyCode) === -1)
				{
					var editor = $(this), contents = editor.find(".entity");

					// If the tokenbox has a value that contains a token
					if (contents.length > 0)
					{
						editor.empty(); // Clear the editor
						this.appendChild(document.createTextNode("")); // Create an empty textnode to accept new input
						range.setStartAfter(this.childNodes[0]);
						range.collapse(true);

						if (range.isValid()) sel.setSingleRange(range); // Adjust the range & selection
						return true; // Break execution, do not continue past this line
					}
				}

				// Handling the short cut keystrokes
				if (ev.ctrlKey && self.options.wysiwyg.enabled)
				{
					switch (ev.keyCode)
					{
						case 66:
							self._execCommand("bold", false, null);
							return false;
							break;
						case 69:
							self._execCommand("justifycenter", false, null);
							return false;
							break;
						case 73:
							self._execCommand("italic", false, null);
							return false;
							break;
						case 74:
							self._execCommand("justifyfull", false, null);
							return false;
							break;
						case 76:
							self._execCommand("justifyleft", false, null);
							return false;
							break;
						case 82:
							self._execCommand("justifyright", false, null);
							return false;
							break;
						case 85:
							self._execCommand("underline", false, null);
							return false;
							break;
						case 107:
							if (ev.shiftKey)
							{
								self._execCommand("superscript", false, null);
							}
							else
							{
								self._execCommand("subscript", false, null);
							}
							return false;
							break;
						case 188:
							self._execCommand("decreasefontsize", false, null);
							return false;
							break;
						case 190:
							self._execCommand("increasefontsize", false, null);
							return false;
							break;
					}
				}

				// Moving the range/selection outside a token if content will be changed
				if (range.collapsed)
				{
					var node = null, br;

					switch (ev.keyCode)
					{

						case 8:
						case 46:
							// Backspace (8) & Delete (46)

							var prevnode, nextnode, joinOffset = null;

							if (startContainer.nodeType === 3 && $(startContainer.parentNode).hasClass("text-node"))
							{
								// Range within a text-node
								if ($(startContainer.parentNode).hasClass("empty"))
								{
									node = startContainer.parentNode;
								}
								else if ((startOffset === 1 && ev.keyCode === 8) || (startOffset === 0 && ev.keyCode === 46))
								{
									if (startContainer.nodeValue.length === 1)
									{
										// Backspace/Delete on last remaining character
										// Transform node to an empty text-node
										startContainer.nodeValue = "\u200B";
										$(startContainer.parentNode).addClass("empty");
										return false;
									}
								}
								else if ((startOffset === startContainer.nodeValue.length && ev.keyCode === 46)
									|| (startOffset === 0 && ev.keyCode === 8))
								{
									node = startContainer.parentNode;
								}
							}
							else if (startContainer.nodeType === 1)
							{
								// Range set on an element
								if ($(startContainer).hasClass("token-input-editor-area"))
								{
									// On the tokenbox's editor itself, finding the targeted child
									if (startContainer.childNodes.length > 0)
									{
										if (startContainer.childNodes.length === startOffset)
										{
											node = startContainer.childNodes[startOffset - 1];
										}
										else
										{
											node = startContainer.childNodes[startOffset];
										}
									}
								}
								else if ($(startContainer).hasClass("text-node") && $(startContainer).hasClass("empty"))
								{
									// On an empty text-node
									node = startContainer;
								}
							}

							// Targeted text-node determined, now perform the action
							if (node !== null)
							{
								if (ev.keyCode === 8)
								{
									// Handling backspace
									prevnode = node.previousSibling;

									if (prevnode !== null && ($(prevnode).hasClass("entity") || prevnode.nodeName.toUpperCase() === "BR"))
									{
										$(prevnode).remove(); // Remove the token or line-break

										prevnode = node.previousSibling; // Get next previous node

										if (prevnode !== null && prevnode.nodeType === 1)
										{
											if ($(prevnode).hasClass("text-node") && $(node).hasClass("text-node"))
											{
												// Two adjacent text-nodes
												if ($(prevnode).hasClass("empty") && $(node).hasClass("empty"))
												{
													// Two adjacent empty text nodes, remove at least one
													$(prevnode).remove();
												}
												else if (!$(prevnode).hasClass("empty") && $(node).hasClass("empty"))
												{
													// Remove trailing empty text node
													$(node).remove();
													node = prevnode;
												}
												else if ($(prevnode).hasClass("empty") && !$(node).hasClass("empty"))
												{
													// Remove leading empty text node
													$(prevnode).remove();
													joinOffset = 0;
												}
												else if (!$(prevnode).hasClass("empty") && !$(node).hasClass("empty"))
												{
													// Join the two non-empty text-nodes
													joinOffset = (prevnode.childNodes.length > 0) ? prevnode.childNodes[0].nodeValue.length : 0; // Calculate offset for range adjustment
													$(prevnode).text($(prevnode).text() + $(node).text()); // Merge the text-nodes
													$(node).remove(); // Remove the now defunction node
													node = prevnode;
												}
											}
										}
									}
								}
								else if (ev.keyCode === 46)
								{
									// Handling delete
									nextnode = node.nextSibling;

									if (nextnode !== null && ($(nextnode).hasClass("entity") || nextnode.nodeName.toUpperCase() === "BR"))
									{
										$(nextnode).remove(); // Remove the token

										nextnode = node.nextSibling; // Get next next node

										if (nextnode !== null && nextnode.nodeType === 1)
										{
											if ($(nextnode).hasClass("text-node") && $(node).hasClass("text-node"))
											{
												// Two adjacent text-nodes
												if ($(nextnode).hasClass("empty") && $(node).hasClass("empty"))
												{
													// Two adjacent empty text nodes, remove at least one
													$(nextnode).remove();
												}
												else if (!$(nextnode).hasClass("empty") && $(node).hasClass("empty"))
												{
													// Remove trailing empty text node
													$(node).remove();
													node = nextnode;
													joinOffset = 0;
												}
												else if ($(nextnode).hasClass("empty") && !$(node).hasClass("empty"))
												{
													// Remove leading empty text node
													$(nextnode).remove();
												}
												else if (!$(nextnode).hasClass("empty") && !$(node).hasClass("empty"))
												{
													// Join the two non-empty text-nodes
													joinOffset = node.childNodes[0].nodeValue.length; // Calculate offset for range adjustment
													$(node).text($(node).text() + $(nextnode).text()); // Merge the text-nodes
													$(nextnode).remove(); // Remove the now defunction node
												}
											}
										}
									}
								}

								if (node !== null)
								{
									// Adjust the range
									sel = rangy.getSelection();
									range = rangy.createRange();

									if (joinOffset !== null)
									{
										range.setStart(node.childNodes[0], joinOffset);
										range.collapse(true);
									}
									else
									{
										range.selectNodeContents(node);
										range.collapse($(node).hasClass("empty") ? true : false);
									}

									sel.setSingleRange(range);
								}

								return false;
							}

							break;

						case 13:
							// Enter

							br = document.createElement("br");

							if (startContainer.nodeType === 3 && $(startContainer.parentNode).hasClass("text-node"))
							{
								node = startContainer.parentNode;

								if (startOffset === 0)
								{
									// At the start of the text-node
									$(br).insertBefore(node);

									if ($(br.previousSibling).hasClass("entity"))
									{
										$("<span class=\"text-node empty\">&#8203;</span>").insertBefore(br);
									}
								}
								else if (startOffset === startContainer.nodeValue.length)
								{
									// At the end of the text-node
									$(br).insertAfter(node);

									if (br.nextSibling === null || $(br.nextSibling).hasClass("entity"))
									{
										$("<span class=\"text-node empty\">&#8203;</span>").insertAfter(br);
									}
								}
								else
								{
									// In the middle of the text-node
									var val = [startContainer.nodeValue.substring(0, startOffset), startContainer.nodeValue.substring(startOffset)];

									$(node).text(val[0]);
									$(node).after(br);
									$(br).after("<span class=\"text-node\">" + val[1] + "</span>");
								}
							}
							else if (startContainer.nodeType === 1 && $(startContainer).hasClass("text-node"))
							{
								node = startContainer;

								// At the start of the text-node
								$(br).insertBefore(node);

								if ($(br.previousSibling).hasClass("entity"))
								{
									$("<span class=\"text-node empty\">&#8203;</span>").insertBefore(br);
								}
							}
							else
							{
								range.insertNode(br);
								$("<span class=\"text-node empty\">&#8203;</span>").insertAfter(br);
							}

							node = br.nextSibling;

							// If there is an node after the new line break, set the range to its start
							if (node !== null)
							{
								sel = rangy.getSelection();
								range = rangy.createRange();
								range.selectNodeContents(node);
								range.collapse(true); // collapse to start of node's contents
								sel.setSingleRange(range);
								ev.preventDefault();
							}

							return false;

							break;

						case 37:
							// Left Arrow

							if (startContainer.nodeType === 3 && $(startContainer.parentNode).hasClass("text-node") && (startOffset === 0 || $(startContainer.parentNode).hasClass("empty")))
							{
								// Caret is before the first character of the text node or on an empty text-node
								node = startContainer.parentNode.previousSibling;
							}
							else if (startContainer.nodeType === 1)
							{
								// Range set on an element
								if ($(startContainer).hasClass("token-input-editor-area"))
								{
									// On the tokenbox's editor itself, finding the targeted child
									if (startContainer.childNodes.length > 0)
									{
										if (startContainer.childNodes.length === startOffset)
										{
											node = startContainer.childNodes[startOffset - 1];
										}
										else
										{
											node = startContainer.childNodes[startOffset];
										}
									}

									node = node.previousSibling;
								}
								else if ($(startContainer).hasClass("text-node") && $(startContainer).hasClass("empty"))
								{
									// On an empty text-node
									node = startContainer.previousSibling;
								}
							}

							// Find previous text-node
							while (node !== null && !$(node).hasClass("text-node"))
							{
								node = node.previousSibling;
							}

							// Adjust range
							if (node !== null && $(node).hasClass("text-node"))
							{
								sel = rangy.getSelection();
								range = rangy.createRange();
								range.selectNodeContents(node);

								range.collapse($(node).hasClass("empty") ? true : false);

								sel.setSingleRange(range);

								return false;
							}

							break;

						case 39:
							// Right Arrow

							if (startContainer.nodeType === 3 && $(startContainer.parentNode).hasClass("text-node") && (startContainer.nodeValue.length === startOffset || $(startContainer.parentNode).hasClass("empty")))
							{
								// Caret is after the last character of the text node
								node = startContainer.parentNode.nextSibling;
							}
							else if (startContainer.nodeType === 1)
							{
								// Range set on an element
								if (startContainer.childNodes.length > 0)
								{
									if ($(startContainer).hasClass("token-input-editor-area"))
									{
										// On the tokenbox's editor itself, finding the targeted child
										if (startContainer.childNodes.length === startOffset)
										{
											node = startContainer.childNodes[startOffset - 1];
										}
										else
										{
											node = startContainer.childNodes[startOffset];
										}

										node = node.nextSibling;
									}
									else if ($(startContainer).hasClass("text-node") && $(startContainer).hasClass("empty"))
									{
										// On an empty text-node
										node = startContainer.nextSibling;
									}
								}
							}

							// Find next text-node
							while (node !== null && !$(node).hasClass("text-node"))
							{
								node = node.nextSibling;
							}

							// Adjust range
							if (node !== null && $(node).hasClass("text-node"))
							{
								sel = rangy.getSelection();
								range = rangy.createRange();
								range.selectNodeContents(node);

								range.collapse($(node).hasClass("empty") ? false : true);

								sel.setSingleRange(range);

								return false;
							}

							break;

						default:
							// All other keys

							// Except for control keys...
							if (self.controlcodes.indexOf(ev.keyCode) === -1)
							{
								// Keystrokes on 'empty' text-nodes
								if ((startContainer.nodeType === 1 && $(startContainer).hasClass("text-node") && $(startContainer).hasClass("empty"))
									|| (startContainer.nodeType === 3 && $(startContainer.parentNode).hasClass("text-node") && $(startContainer.parentNode).hasClass("empty")))
								{

									if (startContainer.nodeType === 3)
									{
										startContainer = startContainer.parentNode;
									}

									// If this is an empty textnode (placeholder), it will now have content,
									// select the content (zero width character) so it's replaced
									$(startContainer).removeClass("empty");
									sel = rangy.getSelection();
									range = rangy.createRange();
									range.selectNodeContents(startContainer);
									sel.setSingleRange(range);
								}
								else if ($(startContainer).hasClass("token-input-editor-area"))
								{
									setTimeout(function ()
									{
										// Chrome bug not raising the event with the correct target. Fix non-empty empty text-nodes.
										var emptyNodes = $(startContainer).find(".text-node.empty");
										for (var i = 0; i < emptyNodes.length; i++)
										{
											var emptyNode = $(emptyNodes[i]);
											var emptyNodeVal = emptyNode.text().replace(self.regexp.zeroWidthSpace, "");
											if (emptyNodeVal.length > 0)
											{
												emptyNode.removeClass("empty");
											}
										}
									}, 0);
								}
							}
					}
				}
			});

			// Keystroke Handling
			self.editor.on("keyup.tokenbox", function (ev)
			{
				var sel = rangy.getSelection(), range = (sel.rangeCount > 0) ? sel.getRangeAt(0) : rangy.createRange(), token = null;
				var startContainer = range.startContainer, startOffset = range.startOffset, endContainer = range.endContainer, endOffset = range.endOffset;

				if (range.collapsed && startContainer.nodeType === 1)
				{
					if ($(startContainer).closest(".entity").length > 0)
					{
						token = $(startContainer).closest(".entity");
					}
					else if ($(startContainer.childNodes[startOffset]).is(".entity"))
					{
						token = $(startContainer.childNodes[startOffset]);
					}

					if (checkExists(token))
					{
						switch (ev.keyCode)
						{
							case 35:
								// End
								if (token[0].nextSibling !== null && token[0].nextSibling.nodeType !== 1)
								{
									range.setStartAfter(token[0]);
									sel.setSingleRange(range);
								}
								else
								{
									range.selectNodeContents(token.children(".entity-text")[0].firstChild);
									range.collapse(false);
									sel.setSingleRange(range);
								}
								return false;
								break;
							case 36:
								// Home
								if (token[0].previousSibling !== null && token[0].previousSibling.nodeType !== 1)
								{
									range.setStartBefore(token[0]);
									sel.setSingleRange(range);
								}
								else
								{
									range.selectNodeContents(token.children(".entity-text")[0].firstChild);
									range.collapse(true);
									sel.setSingleRange(range);
								}
								return false;
								break;
						}
					}
				}

				self._trigger("keypress", ev);
			});

			// Focus handling
			self.editor.on("focus.tokenbox", function (ev, rangeselect)
			{
				self.options.htmlValue = self.editor.html();
				self.options.active = true;
				self.control.find(".input-control-content > .token-input-watermark").remove();
				self.control.addClass("active");

				var sel = rangy.getSelection(), range = (sel.rangeCount > 0) ? sel.getRangeAt(0) : rangy.createRange();
				var startContainer = range.startContainer, startOffset = range.startOffset, endContainer = range.endContainer, endOffset = range.endOffset;

				// If no targeted selection is given but a token was just dropped
				if (!checkExists(rangeselect))
				{
					if (self.editor.find(".entity.dropped").length > 0)
					{
						rangeselect = self.editor.find(".entity.dropped");
						rangeselect.removeClass("dropped");
					}
				}

				// Targeted selection provided, adjust the range
				if (checkExists(rangeselect))
				{
					var node = null;

					// Select the element passed as the rangeselect argument
					if (rangeselect.hasClass("entity"))
					{
						node = rangeselect[0].nextSibling;

						if (!(node !== null && node.nodeType === 1 && $(node).hasClass("text-node")))
						{
							$("<span class=\"text-node empty\">&#8203;</span>").insertAfter(rangeselect);
							node = rangeselect[0].nextSibling;
						}
					}
					else if (rangeselect.hasClass("text-node"))
					{
						node = rangeselect[0];
					}

					// Adjust range
					if (node !== null && $(node).hasClass("text-node"))
					{
						range.setStart(node.childNodes[0], 0);

						range.collapse($(node).hasClass("empty") ? false : true);

						sel.setSingleRange(range);
					}
				}

				// Trigger tokenbox focus event
				self._trigger("focus", ev, { select: rangeselect });
			});

			// Blur handling
			if (!self.options.wysiwyg.enabled)
			{
				self.editor.on("blur.tokenbox", self._onBlur.bind(self));
			}

			if (self.options.droppableEnabled === true)
			{
				self.enableDroppable();
			}

			// Drag-n-drop hover implementation
			self.editor.on("mousemove.tokenbox", function (ev)
			{
				if (self.draggable !== null)
				{
					var target = $(ev.target), caret = self.editor.find(".active-caret");

					// Remove the current caret if the target is not the parent element of it
					if (caret.length > 0 && caret.parent()[0] !== target[0]) caret.remove();

					// Remove any hover character caret application
					self.editor.find(".char.over, .text-node.over").removeClass("over");

					// Apply new caret position
					if (target.hasClass("token-input-editor-area"))
					{
						// If the cursor is not over a character, entity or editor line, place the drop caret on the last line
						if (caret.length === 0) self.editor.children(".editor-line:last-child").append("<span class=\"active-caret\"></span>");
					}
					else if (target.hasClass("editor-line"))
					{
						// If the cursor is not over a character or entity but over an editor line, place the drop caret on the applicable line
						if (caret.length === 0) target.append("<span class=\"active-caret\"></span>");
					}
					else if (target.hasClass("char") || target.hasClass("text-node"))
					{
						// If the cursor is over a character, apply the over class indicating the caret position
						target.addClass("over");
					}

					// IE8 targetting to ensure caret display
					if (SourceCode.Forms.Browser.msie && SourceCode.Forms.Browser.version < 9 && self.editor.find(".active-caret").length > 0)
					{
						self.editor.find(".active-caret").addClass("ie8");
					}
				}
			});

			// Watermark display handling
			self.control.on("click.tokenbox", ".token-input-watermark", function () { this.editor.trigger("focus"); }.bind(self));

			// General click handling on editor canvas
			self.editor.on("click.tokenbox", function (ev)
			{
				var target = $(ev.target), node = null, prevnode, collapseToStart = false;
				var sel = rangy.getSelection(), range = (sel.rangeCount > 0) ? sel.getRangeAt(0) : rangy.createRange();
				var startContainer = range.startContainer, startOffset = range.startOffset, endContainer = range.endContainer, endOffset = range.endOffset;

				if (target.hasClass("text-node") && target.hasClass("empty"))
				{
					// Click on empty textnode (placeholder)
					node = target[0];
				}
				else if (target.closest(".entity").length > 0)
				{
					// Click on a token
					node = target.closest(".entity")[0];

					collapseToStart = true;

					while (node.nextSibling !== null && !$(node).hasClass("text-node"))
					{
						node = node.nextSibling;
					}
				}

				if (node !== null)
				{
					range = rangy.createRange();
					range.selectNodeContents(node);
					range.collapse(collapseToStart);
					if (range.getNodes().length > 0)
					{
						sel.setSingleRange(range);
					}
				}

				return false;

			});

			// Paste Handling - Stripping plain text when non-WYSIWYG
			self.editor.on("paste.tokenbox", function (ev)
			{
				var sel = rangy.getSelection(),
					range = (sel.rangeCount > 0) ? sel.getRangeAt(0) : rangy.createRange(),
					token = null;

				var startContainer = range.startContainer,
					startOffset = range.startOffset,
					endContainer = range.endContainer,
					endOffset = range.endOffset;

				// Shifting the selection behind the token
				if (range.collapsed && startContainer.nodeType === 1 && $(startContainer).hasClass("entity") && startOffset === 0)
				{
					token = $(startContainer);

					if (token[0].nextSibling === null || token[0].nextSibling.nodeType === 1)
					{
						var ntn = document.createTextNode(" ");
						if (token[0].nextSibling === null)
						{
							ntn = token[0].parentNode.appendChild(ntn);
						}
						else
						{
							ntn = token[0].parentNode.insertBefore(ntn, token[0].nextSibling);
							self.resetrange = { node: ntn };
						}
						range.selectNode(ntn);
						sel.setSingleRange(range);
					}
				}

				// Strip HTML from pasted text
				if (!self.options.wysiwyg.enabled)
				{
					ev.preventDefault();

					var text = "";

					if ((ev.originalEvent || ev).clipboardData !== undefined)
					{
						text = (ev.originalEvent || ev).clipboardData.getData('text/plain');
					}
					else if (window.clipboardData)
					{
						text = window.clipboardData.getData('Text');
					}

					// If single line, strip line breaks as well
					if (!self.options.multiline)
					{
						text = text.replace(/\r\n/g, "").replace(/\n/g, "");
					}

					var pasted = document.createTextNode(text);
					range.insertNode(pasted);

					range.setStart(pasted, pasted.nodeValue.length);
					range.collapse(true);

					if (range.isValid())
					{
						sel.setSingleRange(range);
					}
				}
			});
		},

		enableDroppable: function ()
        {
            this.options.droppableEnabled = true;
			if (!this.control.is(".disabled"))
			{
				// Drag-n-drop implementation
				this.editor.droppable(
				{
					accept: this.options.accept,
					tolerance: "pointer",
					activate: this._tokenActivate.bind(this),
					deactivate: this._tokenDeactivate.bind(this),
					over: this._tokenOver.bind(this),
					out: this._tokenOut.bind(this),
					drop: this._tokenDrop.bind(this)
				});
			}
		},

		disableDroppable: function ()
        {
           
            if (!this.control.is(".disabled") && this.options.droppableEnabled === true)
			{
				this.editor.droppable("destroy");
            }
            this.options.droppableEnabled = false;
		},

		_mergeTextNodes: function ()
		{
			// Merging adjacent text nodes to minimize the size of the results object.
			var self = this;

			// Wrap any unwrapped text-nodes
			this.editor.contents().filter(function () { return this.nodeType !== 1; }).wrap("<span class=\"text-node\"></span>");
			this.editor.find("*:not(.text-node, .entity-text)").contents().filter(function () { return this.nodeType !== 1; }).wrap("<span class=\"text-node\"></span>");

			// Clean-up placeholder text nodes next to valid text nodes
			this.editor.find(".text-node:not(.empty)").each(function ()
			{
				$(this).prev(".text-node.empty").remove(); // Previous empty sibling
				$(this).next(".text-node.empty").remove(); // Next empty sibling
				$(this).text($(this).text().replace(self.regexp.zeroWidthSpace, "")); // Remove any zero-width-space characters
			});

			// The joining process
			var textNodes = this.editor.find(".text-node");
			index = 0;
			while (index < textNodes.length)
			{
				var textNode = textNodes.eq(index);
				var nextNode = textNode.next();
				while (nextNode.hasClass(".text-node"))
				{
					//Append & clean-up
					textNode.text(textNode.text() + nextNode.text());
					nextNode.remove();
					nextNode = textNode.next();
					index++;
				}
				index++;
			}

			// Ensure that empty text-nodes are removed if they are the only remaining content
			var nodes = this.editor.contents().toArray();
			if (nodes.every(function (el) { return (el.nodeType === 1 && $(el).hasClass("text-node") && $(el).hasClass("empty")) ? true : false; }))
			{
				this.editor.empty();
			}
		},

		_onBlur: function ()
		{
			///<summary>
			///This is the actual blur event commands that are executed on blur
			///</summary>
			this._sanitize();
			this.options.active = false;
			if (this.draggable === null)
			{
				this.control.removeClass("active");

				if (this.options.watermark !== '' && !this.editor.text().length)
				{
					this.control.find(".input-control-content").append("<span class=\"token-input-watermark\">" + this.options.watermark + "</span>");
				}
			}
			this.editor.find(".active-caret").remove();
			if(this.options.htmlValue !== this.editor.html())
			{
				this._trigger("change");
			}
		},

		_restoreTextNodes: function ()
		{
			// Replacing the wrapped text nodes with its contents (unwrap)
			this.editor.find(".text-node").each(function ()
			{
				this.parentNode.replaceChild(document.createTextNode($(this).text()), this);
			});
		},

		_sanitize: function ()
		{
			this.editor.find(".entity:empty").remove(); // Remove empty entities, deletion residual

			// Remove any lone line-breaks (native contenteditable residual, some add a line break element at the end, even when empty)
			var contents = this.editor.contents();

			if (contents.length === 1 && contents[0].nodeType === 1 && contents[0].nodeName.toUpperCase() === "BR")
			{
				this.editor.empty();
				return;
			}

			var s = this.editor.html();
			s = s.replace(this.regexp.rpe, "<br/><br/>"); // Replaces paragraphs with double line breaks (consistency across all browsers)
			s = s.replace(this.regexp.rp, "");
			s = s.replace(this.regexp.lineBreak, "<br/>");  // Retains empty editor lines as line breaks
			s = s.replace(this.regexp.rd, "");
			s = s.replace(this.regexp.rde, "");

			if (!this.options.multiline) s = s.replace(this.regexp.rb, "");

			s = s.replace(this.regexp.formatBR, "<br />");
			s = s.replace(this.regexp.formatOpeningSpan, "<span");
			s = s.replace(this.regexp.formatClosingSpan, "</span>");

			this.editor.html(s);

			this._mergeTextNodes();
		},

		_setOption: function (key, value)
		{
			switch (key)
			{
				case "value":
					this.options.value = value;
					this._setValue(value);
					break;
			}

			if ($.ui.version.substr(0, 3) === "1.9")
			{
				this._super("_setOption", key, value);
			}
			else
			{
				$.Widget.prototype._setOption.apply(this, arguments);
			}

		},

		_setValue: function (value)
		{
			var html = "";
			var self = this;

			$.each(value, function ()
			{
				if (this.type === "value")
				{
					var s = this.data;
					s = s.htmlEncode().replace("\n", "<br/>");
					s = s.replace(self.regexp.rls, function (x) { return new Array(x.length + 1).join('&nbsp;'); });
					s = s.replace(self.regexp.rts, function (x) { return new Array(x.length + 1).join('&nbsp;'); });

					html += s;
				}
				else
				{
					var m = {}, icon = "";
					var mLength = 0;

					$.each(this.data, function (k, v)
					{
						if (k === "icon") icon = v;
						switch (typeof v)
						{
							case "boolean":
							case "number":
								m[k] = v;
								mLength++;
								break;
							case "string":
								m[k] = v;
								mLength++;
						}
					});
					//TODO: TD 0001
					var statusClass = "";
					if (checkExistsNotEmpty(this.status))
					{
						statusClass = " " + this.status.toLowerCase();
						m.status = this.status;
					}
					var text = checkExistsNotEmpty(this.text) ? this.text.htmlEncode() : "";
					var iconClass = checkExistsNotEmpty(icon) ? " icon " + icon : "";
					var dataOpts = mLength > 0 ? " data-options=\"" + jQuery.toJSON(m).htmlEncode() + "\"" : "";
					var tooltip = checkExistsNotEmpty(this.tooltip) ? " title=\"" + this.tooltip.replace(/"/g, "") + "\"" : "";

					// Do not use string format function here because the dataOpts might include tokens that will be incorrectly replaced in the destination string.
					html += "<span class=\"entity resolved" + statusClass + iconClass + "\"" + dataOpts + tooltip;
					html += " contenteditable=\"false\"><span class=\"entity-text\">" + text + "</span></span>";
				}
			});

			this.editor.html(html);

			if (this.options.watermark !== '' && !this.editor.text().length)
			{
				this.control.find(".input-control-content").append("<span class=\"token-input-watermark\">" + this.options.watermark + "</span>");
			}
			else if (this.editor.text().length > 0)
			{
				this.control.find(".input-control-content > .token-input-watermark").remove();
				this._wrapTextNodes();

				// Placeholder for text ahead of entities that has no text nodes ahead of it
				this.editor.find(".entity:first-child, .entity + .entity, .entity + br:last-child").each(function ()
				{
					$("<span class=\"text-node empty\">&#8203;</span>").insertBefore(this);
				});

				// Placeholder for text after entities that are at the end (typically single-line instances)
				this.editor.find(".entity:last-child").each(function ()
				{
					$("<span class=\"text-node empty\">&#8203;</span>").insertAfter(this);
				});
			}

		},

		_tokenActivate: function (ev, ui)
		{
			if (this.options.active)
			{
				this.editor.trigger("blur");
			}

			this._disableEditor();
		},

		_tokenDeactivate: function (ev, ui)
		{
			this._enableEditor();
		},

		_tokenDrop: function (ev, ui)
		{
			var target = $(ev.originalEvent.target), index, sel, range, textnode;

			if (!checkExists(this.draggable))
			{
				this.draggable = ui.draggable;
			}

			if (!this.options.multiValue)
			{
				// If dropped on text or an entity, reset target to clear the line
				if (target.hasClass("char") || target.hasClass("entity") || target.hasClass("entity-text"))
				{
					target = target.closest(".editor-line");
				}
				target.empty();
				this.element.val("");
			}

			var m = {}, icon = "";
			var mLength = 0;

			// Fetching some info from the draggable to use to populate the token/entity on the canvas
			$.each(this.draggable.parent().metadata(), function (k, v)
			{
				if (k === "icon") icon = v;
				switch (typeof v)
				{
					case "boolean":
					case "number":
						m[k] = v;
						mLength++;
						break;
					case "string":
						m[k] = v;
						mLength++;
						break;
				}
			});

			// Getting some tooltip info
			var tooltip = "";
			var draggingNode = this.draggable.data("draggingNode");
			if (draggingNode && $chk(draggingNode.tooltip))
			{
				tooltip = draggingNode.tooltip;
			}

			// Building the Token/Entity HTML to be injected into the canvas at the tartget
			//TODO: TD 0001
			var tokenHtml = "<span class=\"entity resolved dropped" + (icon !== "" ? " icon " + icon : "");

			if (mLength > 0)
			{
				tokenHtml += "\" data-options=\"" + jQuery.toJSON(m).htmlEncode();
			}

			tokenHtml += "\"" + (tooltip !== "" ? (" title=\"" + tooltip.replace(/"/g, "") + "\"") : "")
				+ " contenteditable=\"false\"><span class=\"entity-text\">" + this.draggable.text().htmlEncode() + "</span></span>";

			var token = $(tokenHtml);

			// Remove the faked caret
			this.editor.find(".active-caret").remove();

			if (target.hasClass("text-node") && target.hasClass("empty"))
			{
				// If the target is an empty character placeholder, replace it with a token
				target.replaceWith(token);
				$("<span class=\"text-node empty\">&#8203;</span>").insertBefore(token);

				if (token.next().hasClass("entity"))
				{
					$("<span class=\"text-node empty\">&#8203;</span>").insertAfter(token);
				}
			}
			else if (target.hasClass("char"))
			{
				// If the target is a character, calculate the index and inject at that index
				var parent = target.parent(".text-node");
				index = parent.children(".char").index(target[0]);

				// Splitting the textnode at the target
				var pretext = $("<span class=\"text-node\"></span>").prependTo(parent);
				var postext = $("<span class=\"text-node\"></span>").appendTo(parent);

				pretext.append(target.prevAll(".char").toArray().reverse());
				postext.append(target.nextAll(".char")).prepend(target);
				token.insertBefore(postext);

				parent.children().insertBefore(parent);
				parent.remove(); // Remove the now empty node

				if (pretext.text() === "")
				{
					// If there is no text leading the token, create a placeholder
					pretext.replaceWith("<span class=\"text-node empty\">&#8203;</span>");
				}
			}
			else if (target.hasClass("entity") || target.hasClass("entity-text"))
			{
				// If the target is an existing entity, place behind the existing entity
				target.closest(".entity").after(token);
				$("<span class=\"text-node empty\">&#8203;</span>").insertAfter(target.closest(".entity"));
			}
			else if (target.hasClass("editor-line"))
			{
				target.removeClass("empty"); // Cleanup of line placeholders

				// If the target is an editor line, append the entity to that line
				if (target.is(":empty"))
				{
					target.append("<span class=\"text-node empty\">&#8203;</span>"); // Add place holder for text before the token
				}

				target.append(token);
				target.append("<span class=\"text-node empty\">&#8203;</span>"); // Add place holder for text after the token
			}
			else if (target[0] === this.editor[0])
			{
				// If the target is the editor itself, try to find the last editor line and append to it
				var lastEditorLine = this.editor.children(".editor-line:last-child");

				if (lastEditorLine.is(":empty"))
				{
					lastEditorLine.append("<span class=\"text-node empty\">&#8203;</span>"); // Add place holder for text before the token
				}

				lastEditorLine.append(token);
				lastEditorLine.append("<span class=\"text-node empty\">&#8203;</span>"); // Add place holder for text after the token
			}

			this.editor.find(".entity").off("mouseenter.tokenbox");

			if (this.editor.data("revert") !== undefined) this.editor.removeData("revert");

			// Restore split text nodes
			this.editor.find(".text-node").each(function () { $(this).text($(this).text()); });

			this.draggable = null;
			this._unWrapEditorLines();
			this._sanitize();

			ui.tokenbox = {};
			ui.tokenbox.element = this.element;
			ui.tokenbox.editor = this.editor;

			this._trigger("drop", ev, ui);
			this._trigger("change");

			// Drop fires before de-activate, which means the editor is not yet enabled to take focus
			// Breaking the execution below will ensure the editor will take focus
			window.setTimeout(function ()
			{
				/* Setting the range ensures that focus will be placed on the tokenbox on which the token was dropped */
				var sel = rangy.getSelection(),
					range = (sel.rangeCount > 0) ? sel.getRangeAt(0) : rangy.createRange();

				var dropped = this.editor.children(".dropped");

				if (dropped.length > 0)
				{
					range.setStartAfter(dropped[0]);
					range.collapse(true);

					if (range.isValid())
					{
						sel.setSingleRange(range);
					}

					this.editor.trigger("focus");
				}
			}.bind(this), 0);
		},

		_tokenOut: function (ev, ui)
		{
			ui.helper.removeClass("valid");
			this.draggable = null;
			this.editor.find(".active-caret").remove();
			this.control.removeClass("active");

			this.editor.find(".entity").off("mouseenter.tokenbox");

			if (this.editor.data("revert") !== undefined)
			{
				this.editor.html(this.editor.data("revert"));
				this.editor.removeData("revert");
			}
			else
			{
				this._sanitize();
			}

			// Re-apply the watermark
			if (this.options.watermark !== '' && !this.editor.text().length)
			{
				this.control.find(".input-control-content").append("<span class=\"token-input-watermark\">" + this.options.watermark + "</span>");
			}
		},

		_tokenOver: function (ev, ui)
		{
			var self = this;

			// Removing watermark to allow the display for a caret
			self.control.find(".input-control-content > .token-input-watermark").remove();

			// Visual feedback on droppability
			this.control.addClass("active");
			ui.helper.addClass("valid");

			self.draggable = ui.draggable;

			// Splitting the editor into its seperate lines
			self._wrapEditorLines();

			// Wrap each character in each text-node with a character span
			self.editor.find(".text-node").each(function ()
			{
				var textnode = $(this), text = textnode.text(), result = [];

				for (var i = 0; i < text.length; i++) result.push(text.substr(i, 1));

				if (result.length > 0)
				{
					textnode.html("<span class=\"char\">" + result.join("</span><span class=\"char\">") + "</span>");
				}
				else
				{
					textnode.html("<span class=\"char empty\"></span>");
				}

			});

			// If the editor is empty add a single empty editor line
			if (self.editor.children().length === 0)
			{
				self.editor.append("<div class=\"editor-line\"></div>");
			}

			// If this is a multiline tokenbox, add a new droppable line when none exist
			if (self.options.multiline)
			{
				var lastEditorLine = self.editor.children(".editor-line").last();
				var lastEditorLineElements = lastEditorLine.children();

				var addEmptyEditorLine = lastEditorLine.length === 0; // Is an empty editor

				if (!addEmptyEditorLine && lastEditorLineElements.length > 0)
				{
					addEmptyEditorLine = lastEditorLineElements.length > 1; // Last line is not empty

					if (!addEmptyEditorLine && !lastEditorLineElements.hasClass("empty")) // Does not contain a text place-holder
					{
						addEmptyEditorLine = true
					}
				}

				if (addEmptyEditorLine)
				{
					self.editor.append("<div class=\"editor-line empty\"></div>");
				}
			}
		},

		_toolbarClick: function (ev)
		{
			var command = $(ev.currentTarget).attr("command").toLowerCase();

			switch (command)
			{
				case "bold":
				case "italic":
				case "underline":
				case "strikethrough":
				case "subscript":
				case "superscript":
				case "justifyleft":
				case "justifycenter":
				case "justifyright":
					this._execCommand(command, false, null);
					break;
				case "clear":
					this.clear();
					break;
			}

		},

		_unWrapEditorLines: function ()
		{
			// If the last elements are empty editor lines, remove the them
			var lel = this.editor.children(":last-child");

			// While the last line is empty, remove it
			while (lel.is(".editor-line:empty"))
			{
				lel.remove();
				lel = this.editor.children(".editor-line:last-child");
			}

			// Single editor line, avoid unnecessary line breaks being added
			if (lel.is(":only-child"))
			{
				this.editor.html(lel.html());
				return;
			}

			// Remove the class attribute to allow sanitasion of the editor lines (divs to brs - see _santize())
			this.editor.find(".editor-line").each(function ()
			{
				$(this).removeAttr("class");
			});
		},

		_value: function ()
		{
			var result = [];

			this._sanitize();

			if (this.options.wysiwyg.enabled)
			{
				var html = this.editor.html(), esi, eei; // EntityStartIndex, EntityEndIndex

				if (html.indexOf("<span class=\"entity resolved") !== -1)
				{
					// Editor contains at least one token
					while (html.indexOf("<span class=\"entity resolved") !== -1)
					{
						esi = html.indexOf("<span class=\"entity resolved");

						result.push({ type: "value", data: html.substring(0, esi) });

						eei = html.indexOf("</span>", esi) + "</span>".length;

						var entityhtml = $(html.substring(esi, eei));

						result.push({ type: "context", data: entityhtml.metadata(), text: entityhtml.text() });

						html = html.substring(eei);
					}

					result.push({ type: "value", data: html });
				}
				else
				{
					// Editor only has 'textual' content (no tokens)
					result.push({ type: "value", data: html });
				}
			}
			else
			{
				this.editor.contents().each(function (index, node)
				{
					this.handleContents(node, result);
				}.bind(this));
			}

			// Some cleanup
			if (result.length > 0 && result[result.length - 1].type === "value" && result[result.length - 1].data === "<br />") result.pop();

			return result;
		},

		_wrapEditorLines: function ()
		{
			// Cleanup browser residual line breaks (IE)
			if (this.editor.html().toLowerCase() === "<br>")
			{
				this.editor.empty();
			}

			// Splitting the editor into its seperate lines through wrapping
			var orightml = this.editor.html();
			this.editor.data("revert", orightml); // Back-up of HTML
			var splithtml = orightml.split(this.regexp.rb);
			this.editor.html("<div class=\"editor-line\">" + splithtml.join("</div><div class=\"editor-line\">") + "</div>");
		},

		_wrapTextNodes: function ()
		{
			// Wrapping each DOM text node in a span element
			this.editor.contents().filter(function () { return this.nodeType !== 1 && !$(this.parentNode).is(".entity, .entity-text"); }).wrap("<span class=\"text-node\"></span>"); // Non-WYSIWYG
			this.editor.find("*:not(.text-node, .entity, .entity-text)").contents().filter(function () { return this.nodeType !== 1; }).wrap("<span class=\"text-node\"></span>"); // WYSIWYG

			// Adding empty text place holders between line-breaks & tokens
			this.editor.find("br + .entity").each(function ()
			{
				$("<span class=\"text-node empty\">&#8203;</span>").insertBefore(this);
			});
		},

		blur: function ()
		{
			this.editor.trigger("blur");
		},

		// Return a jQuery object containing the reference to the editor element
		geteditor: function ()
		{
			return this.editor;
		},

		handleContents: function (node, result)
		{
			switch (node.nodeType)
			{
				case 1:
					// Element
					if ($(node).hasClass("entity"))
					{
						var resultObj = { type: "context", data: $(node).metadata(), text: $(node).text() };
						resultObj.status = checkExists($(node).metadata().status) ? $(node).metadata().status : "";
						result.push(resultObj);
					}
					else if ($(node).hasClass("text-node"))
					{
						// Only save non-empty text-nodes
						if (!$(node).hasClass("empty") && !$(node).is(":empty"))
						{
							var text = ($(node).text()).replace(this.regexp.nonBreakSpace, " ");
							result.push({ type: "value", data: text, text: text });
						}
					}
					else if ($(node).is("br"))
					{
						result.push({ type: "value", data: "\n", text: "\n" });
						$(node).contents().each(function (index, node)
						{
							this.handleContents(node, result);
						}.bind(this));
					}
					else
					{
						$(node).contents().each(function (index, node)
						{
							this.handleContents(node, result);
						}.bind(this));
					}
					break;
				case 3:
					// Text
					var text = node.nodeValue.replace(this.regexp.rlsc, " ").replace(this.regexp.rtsc, " ");
					if (text !== "")
						result.push({ type: "value", data: text, text: text });
					break;
			}
		},

		disable: function ()
		{
			if (!this.control.is(".disabled"))
			{
				this.control.addClass("disabled");
				this.editor.off();

				this._disableEditor();
			}
		},

		disabled: function ()
		{
			return this.control.hasClass("disabled");
		},

		enable: function ()
		{
			if (this.control.is(".disabled"))
			{
				this.control.removeClass("disabled");
				this._enableEditor();
				this._initEditorEvents();
			}
		},

		focus: function ()
		{
			this.editor.trigger("focus");
		},

		clear: function ()
		{
			this.element.val("");
			this.editor.empty();
			//if there is focus then
			if (document.activeElement !== this.element[0])
			{
				this._onBlur();
			}
		},

		source: function (html)
		{
			if (html === undefined)
			{
				return this.editor.html();
			}

			this.editor.html(html);
			return this;
		},

		stripstyling: function ()
		{
			function striptags()
			{
				if (!$(this).is("span.entity, span.entity-text"))
				{
					var text = $(this).text();
					this.parentNode.replaceChild(document.createTextNode(text), this);
				}
			}

			this.editor.find("span, b, strong, i, em, font, tt, sub, sup, big, small").each(striptags);

			this._sanitize();
		},

		value: function (newValue)
		{
			if (newValue === undefined)
			{
				return this._value();
			}

			this._setOption("value", newValue);
			return this;
		},

		setOption: function (key, value)
		{
			this._setOption(key, value);
		},

		setWatermark: function (value)
		{
			this._setOption("watermark", value);
			this.element.parent().find(".token-input-watermark").text(value);
		}

	});

	//TFS 500580 - For IE9 to stop content editable sections, ala TokenBox, from replacing a@b with mailto:a@b
	document.execCommand("AutoUrlDetect", false, false);

})(jQuery);
