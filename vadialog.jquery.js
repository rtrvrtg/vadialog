/**
 * VA Dialog
 * v0.2
 */

(function( $ ) {

	// Based on the original at
	// www.VADialog.org/digital-access-dialog
	// Namespace was originally called visionaustralia
	var VADialog = {};

	// Set of loaded dialogs
	VADialog.dialogs = {};

	VADialog.DialogHandler = {
		add: function(dialogId, parentElem, closeFn){
			VADialog.dialogs[dialogId] = {
				parentElem:  parentElem,
				closeDialog: closeFn
			};
		},
		remove: function(dialogId){
			
		}
	}

	// Base structure for templating loader
	VADialog.Templates = {
		// Default HTML
		_defaults: {
			remoteload:  '<div data-vadialog-elem-remoteload class="remote-content remote-content-loading" aria-live="polite">{{{loaderContent}}}</div>',

			loading:     '<div data-vadialog-elem-remoteinner class="remote-content-inner">Loading...</div>',
			error:       '<div data-vadialog-elem-remoteinner class="remote-content-inner"><p role="alert">Could not load page.</p></div>',

			shadow:      '<div data-vadialog-elem-shadow class="vashadow">' +
				'{{{closeButton}}}' +
				'{{{dialog}}}' +
				'</div>',
			dialog:      '<div data-vadialog-elem-dialog class="vadialog" data-current-vadialog="{{dialogID}}">' +
				'{{{startSentinel}}}' +
				'{{{startDialog}}}' +
				'<div data-vadialog-elem-content></div>' +
				'{{{endDialog}}}' +
				'{{{endSentinel}}}' +
				'{{{closeProxy}}}' +
				'</div>',
			closebutton: '<button data-vadialog-elem-closebutton class="vaCloseButton" tabindex="999999">' +
				'<span class="vaOffscreen">Close dialog</span>' +
				'</button>',

			sentinel:    '<span data-vadialog-elem-sentinel="{{location}}" class="vaOffscreen" tabindex="0"></span>',
			dialogstart: '<a data-vadialog-elem-dialogmark="start" class="vaOffscreen" tabindex="-1">Dialog start</a>',
			dialogend:   '<span data-vadialog-elem-dialogmark="end" class="vaOffscreen" tabindex="-1">Dialog end</span>',
			closeproxy:  '<span data-vadialog-elem-closeproxy class="vaCloseProxy vaOffscreen" tabindex="0"></span>',
		},

		// Get a template if there is one, picking one from HTML if we can
		get: function(templateName, dataSource){
			var tpl = VADialog.Templates._defaults[templateName];
			if (!!dataSource && !!dataSource.getAttribute) {
				var attr = dataSource.getAttribute('data-vadialog-tpl-' + templateName);
				if (!!attr) {
					tpl = $('#' + attr).html();
				}
			}
			return tpl;
		}
	};
	
	// Generates a random ID string that looks like a GUID
	// Good for assigning IDs to dynamic things or links that don't have IDs
	VADialog.getNewID = function(prefix){
		if (!prefix) prefix = "";
		var S4 = function() {
			return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
		};
		return prefix + "-" + (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
	};

	// Handlers for window
	VADialog.Window = {
		resize: function(dialog, enable){
			var resizeBehaviour = function(){
				VADialog.Dialog.resize(dialog);
			};

			if (enable) {
				$(window).on("resize", resizeBehaviour);
			}
			else {
				$(window).off("resize", resizeBehaviour);
			}
		}
	};

	// Special dialog handler
	VADialog.Dialog = {
		// Resize dialog box to try and fit content into page
		resize: function(dialog, widthHint, heightHint){
			// Added by GR
			// Reset width and height
			dialog.width('').height('');

			// Heavily modified by GR
			// Centers window with more respect to the size of the window
			// @TODO: handle actual pixel size better. Jeez.
			var padLeft  = parseInt(dialog.css("padding-left"), 10);
			var padTop   = parseInt(dialog.css("padding-top"), 10);
			var position = "fixed";

			var closeTop = "0", closeRight = "0";

			var width    = dialog.innerWidth();
			if (dialog.find('.remote-content').length) {
				width = dialog.find('.remote-content').innerWidth();
				width = dialog.find('.remote-content').children().innerWidth();
			}
			if (!!widthHint && !isNaN(widthHint)) width = widthHint;

			closeRight = (window.innerWidth - width) / 2;

			var height   = dialog.innerHeight();
			if (!!heightHint && !isNaN(heightHint)) height = heightHint;

			closeTop = (window.innerHeight - height) / 2;

			var marginLeft = (- width / 2 - padLeft);
			var marginTop = (- height / 2 - padTop);

			if (dialog.css('box-sizing') == "border-box") {
				width  += (2 * padLeft);

				closeRight -= padLeft;
				closeTop -= padTop;
			}

			// Lock to full width when content exceeds screen width, or if screen is small
			if (width > window.innerWidth || window.innerWidth < 480) {
				padLeft = 0;
				width = window.innerWidth;
				marginLeft = (window.innerWidth / -2) - padLeft;
				closeRight = "0";
			}
			// Lock to full height when content exceeds screen height, or if screen is small
			if (height > window.innerHeight || window.innerHeight < 480) {
				marginTop = (window.innerHeight / -2) + padTop;
				position = "relative";
				closeTop = "0";
			}

			var newCSS = {
				marginLeft: marginLeft + "px",
				marginTop: marginTop + "px",
				width: width + "px",
				position: position
			};
			dialog.css(newCSS);

			if (closeRight < 0) closeRight = 0;
			if (closeTop < 0) closeTop = 0;

			dialog.siblings('.vaCloseButton').css({
				top: closeTop + "px",
				right: closeRight + "px"
			});
		},
		// Render 
		renderHTML: function(params, paramSource){
			if (!params.content) params.content = "";

			var sentinelTpl = VADialog.Templates.get('sentinel', paramSource),
			startDialogTpl  = VADialog.Templates.get('dialogstart', paramSource),
			endDialogTpl    = VADialog.Templates.get('dialogend', paramSource),
			closeProxyTpl   = VADialog.Templates.get('closeproxy', paramSource),
			shadowTpl       = VADialog.Templates.get('shadow', paramSource),
			closeButtonTpl  = VADialog.Templates.get('closebutton', paramSource),
			dialogTpl       = VADialog.Templates.get('dialog', paramSource);

			// Generate template HTML
			var dialogPrefs = {
				dialogID:      params.dialogId,
				startSentinel: Handlebars.compile(sentinelTpl)({
					location: "start"
				}),
				startDialog:   Handlebars.compile(startDialogTpl)({
					location: "start"
				}),
				endDialog:     Handlebars.compile(endDialogTpl)({
					location: "end"
				}),
				endSentinel:   Handlebars.compile(sentinelTpl)({
					location: "end"
				}),
				closeProxy:    Handlebars.compile(closeProxyTpl)()
			},
			shadowHTML = Handlebars.compile(shadowTpl)({
				closeButton:   Handlebars.compile(closeButtonTpl)(),
				dialog:        Handlebars.compile(dialogTpl)(dialogPrefs),
			}),
			wrappedDialog = $(shadowHTML);

			wrappedDialog.find('[data-vadialog-elem-content]').replaceWith(params.content);
			return wrappedDialog;
		},
		// Add event handlers for focusing on elements
		addEventHandlers: function(wrappedDialog, closeButton){
			wrappedDialog.find('[data-vadialog-elem-sentinel="start"]').focus(function() {
				wrappedDialog.find('[data-vadialog-elem-dialogmark="start"]').focus();
			});
			wrappedDialog.find('[data-vadialog-elem-sentinel="end"]').focus(function() {
				wrappedDialog.find('[data-vadialog-elem-dialogmark="end"]').focus();
			});
			wrappedDialog.find('[data-vadialog-elem-dialogmark="start"]').focus(function() {
			});
			wrappedDialog.find('[data-vadialog-elem-dialogmark="end"]').blur(function() {
				wrappedDialog.find('[data-vadialog-elem-closebutton]').focus();
			});
			wrappedDialog.find('[data-vadialog-elem-closeproxy]').focus(function() {
				wrappedDialog.find('[data-vadialog-elem-closebutton]').focus();
			});
			wrappedDialog.find('[data-vadialog-elem-closebutton]').blur(function() {
				wrappedDialog.find('[data-vadialog-elem-sentinel="start"]').focus();
			});
			// Add event handler to close button
			wrappedDialog.find('[data-vadialog-elem-closebutton]').click(closeButton);
		}
	};

	// Content modifiers
	VADialog.Content = {
		parentContainer: function(dialogId) {
			return $("#" + dialogId).parent();
		},
		extract: function(dialogId){
			var content = $("#" + dialogId),
			parent      = content.parent(),
			clones      = {
				toCopy: content.clone(true, true),
				toShow: content.clone(true, true)
			}
			content.remove();
			return clones;
		}
	}

	// Modifiers for body elements
	VADialog.Body = {
		// Hide children
		hideChildren: function(body){
			var bodyChildren = [];
			body.children().each(function () {
				var jQchild = $(this);
				
				var o = {
					jqel: jQchild,
					hadVal: false
				};

				if (jQchild.attr("aria-hidden") !== undefined) {
					o.hadVal = true;
					o.originalVal = jQchild.attr("aria-hidden");
				}
				bodyChildren.push(o);

				jQchild.attr("aria-hidden", "true");
			});
			return bodyChildren;
		},
		showChildren: function(bodyChildren){
			for (var i = 0, c; c = bodyChildren[i]; i++) {
				if (c.hadVal) {
					// If element originally had aria-hidden attribute,
					// reinstate its value
					c.jqel.attr("aria-hidden",c.originalVal);
				}
				else {
					// No original aria-hidden value,
					// so remove the attribute entirely
					c.jqel.removeAttr("aria-hidden");
				}
			}
		}
	};

	// Instantiate a dialog
	VADialog.addDialog = function (linkId, dialogId, events){
		if (!linkId || !document.getElementById(linkId)) {
			throw "Link ID is not valid";
		}
		if (!dialogId || !document.getElementById(dialogId)) {
			throw "Dialog ID is not valid";
		}

		// Setup event hooks
		var fBeforeOpen = null;
		if (!!events && !!events.beforeOpen) fBeforeOpen = events.beforeOpen;

		var fAfterOpen = null;
		if (!!events && !!events.afterOpen) fAfterOpen = events.afterOpen;

		var fForCloseButton = null;
		if (!!events && !!events.forCloseButton) fForCloseButton = events.forCloseButton;
				
		// High z-index for shadow & dialog box.
		var bigZ = 16123456;
		// Specify children of <body> that we will add or change aria-hidden on.
		var bodyChildren = [];
		
		// Outside of open function as they are used by close
		var isOpen = false, body = $("body"), cc,
		contentParent = VADialog.Content.parentContainer(dialogId),
		triggerLink = $("#" + linkId);

		// Open current dialog
		function openDialog(link, ev){
			if(isOpen) {
				$('[data-vadialog-elem-dialogmark="start"]').focus();
				ev.preventDefault();
				return;
			}
			isOpen = true;

			// Get template HTML
			cc = VADialog.Content.extract(dialogId);
			cc.toShow.show().removeAttr("aria-hidden");

			// Generate template HTML
			var wrappedDialog = VADialog.Dialog.renderHTML({
				dialogId: dialogId,
				content:  cc.toShow
			}, triggerLink.get(0));
			VADialog.Dialog.addEventHandlers(wrappedDialog, function(){
				if (fForCloseButton && typeof fForCloseButton == "function") {
					fForCloseButton.call($('[data-vadialog-elem-dialog]'), link);
				}
				closeDialog();
			});

			// Run pre-open handler
			if (fBeforeOpen && typeof fBeforeOpen == "function") {
				fBeforeOpen.call(wrappedDialog.find('[data-vadialog-elem-dialog]'), link);
			}

			// Set up z-index rules on shadow, dialog and close button appropriately.
			// Comments for original developer: it made ALL the difference for JAWS 10
			// to have these two lines down here.
			wrappedDialog.find('[data-vadialog-elem-shadow], [data-vadialog-elem-dialog]').css({
				zIndex: bigZ
			});
			wrappedDialog.find('[data-vadialog-elem-closebutton]').css({
				zIndex: bigZ + 1
			});
			
			// Hide all top level elements & remember their aria-hidden status
			bodyChildren = VADialog.Body.hideChildren(body);
			body.append(wrappedDialog);

			// Added by GR
			// Stop body from scrolling behind modal
			body.addClass('hasvamodal');
			
			$('[data-vadialog-elem-shadow]').show();

			VADialog.Dialog.resize($('[data-vadialog-elem-dialog]'));

			$('[data-vadialog-elem-dialog]').show();
			$('[data-vadialog-elem-dialogmark="start"]').focus();

			if (fAfterOpen && typeof fAfterOpen == "function") {
				fAfterOpen.call($('[data-vadialog-elem-dialog]'), link);
			}

			ev.preventDefault();
		}
		
		// Close current dialog
		function closeDialog(){
			if (!isOpen) return;
			isOpen = false;

			VADialog.Window.resize($('[data-vadialog-elem-dialog]'), false);
			VADialog.Body.showChildren(bodyChildren);

			$('[data-vadialog-elem-dialog]').remove();
			$('[data-vadialog-elem-shadow]').remove();

			VADialog.dialogs[dialogId].parentElem.append(cc.toCopy);

			// Added by GR
			// Restore scrolling to body
			body.removeClass('hasvamodal');

			triggerLink.focus();
		}

		// Add event handler to link
		triggerLink.click(function(event) {
			openDialog(this, event);
		});
		
		VADialog.DialogHandler.add(dialogId, contentParent, closeDialog);
	};

	// Close a dialog
	VADialog.closeDialog = function (dialogId){
		if (!!VADialog.dialogs[dialogId]) {
			VADialog.dialogs[dialogId].closeDialog();
		}
		else {
			throw "Dialog not found."
		}
	};

	// Hit escape key to close all modals
	// Do a check to make sure we haven't already bound it
	VADialog.escapeToClose = function (){
		var bound = $(document).data('VADialog.escapeBound');
		if (!bound) {
			var onEscape = function(e){
				if (e.which == 27) {
					$('[data-current-vadialog]').each(function(){
						VADialog.closeDialog(
							$(this).attr('data-current-vadialog')
						);
					});
				}
			};
			$(document).keydown(onEscape);
			$(document).data('VADialog.escapeBound', '1');
		}
	};

	// Special definitions for URL triggers
	var UrlTrigger = {
		// Set up an individual URL trigger
		setup: function(elem){
			var dialogID = null;
			if (!elem.id) {
				// Set an ID on the trigger element.
				elem.id = VADialog.getNewID("vadialog-url-trigger");
			}
			if ($('[data-vadialog-url-trigger="' + elem.id + '"]').length) {
				// If URL trigger destination element exists,
				// use that as the destination.
				dialogID = $('[data-vadialog-url-trigger="' + elem.id + '"]').attr('id');
			}
			else {
				// If URL trigger destination element does not exist,
				// add the new element and use it.
				dialogID = VADialog.getNewID("vadialog-url-container");
				$('body').append(
					$('<div />', {
						id: dialogID,
						hidden: true,
						'aria-hidden': 'true',
						'data-vadialog-url-trigger': elem.id
					})
				);
			}
			return {
				triggerID: elem.id,
				dialogID:  dialogID
			};
		},
		beforeOpen: function(trigger){
			var container = this;

			// Build loader HTML
			var loadContainer = Handlebars.compile(
				VADialog.Templates.get('remoteload', trigger)
			)({
				loaderContent: Handlebars.compile(
					VADialog.Templates.get('loading', trigger)
				)()
			});

			var selector = trigger.getAttribute('data-vadialog-url');
			container.find('[data-vadialog-url-trigger]').append(loadContainer);
			container.find('[data-vadialog-elem-remoteinner]')
			.load($(trigger).attr('href') + " body", function(response, status, xhr){
				var html = "", classes = [], inContainer = $(this);
				if (status == "error") {
					var html = Handlebars.compile(
						VADialog.Templates.get('error', trigger)
					)();
					classes.push('remote-content-failedload');
				}
				else {
					var html = $($.parseHTML(response)).not("meta, link, script");
					if (!!selector.length) {
						// First item must be a top level selector within the body tag
						var bits = selector.split(" ");
						var initial = bits.shift(bits);
						html = html.filter(initial);
						// Anything else we can search on
						if (bits.length > 0) {
							html = html.find(bits.join(" "));
						}
					}
				}
				inContainer.empty().append($(html))
				.removeClass('remote-content-loading')
				.addClass(classes);
				VADialog.Dialog.resize(container);
			});
			VADialog.Dialog.resize(container);
		},
		forCloseButton: function(trigger){
			this.find('.remote-content').remove();
		}
	};

	// Special definitions for iframe triggers
	var IframeTrigger = {
		setup: function(elem){
			var dialogID = null;
			if (!elem.id) {
				elem.id = VADialog.getNewID("vadialog-iframe-trigger");
			}
			if ($('[data-vadialog-iframe-trigger="' + elem.id + '"]').length) {
				dialogID = $('[data-vadialog-iframe-trigger="' + elem.id + '"]').attr('id');
			}
			else {
				dialogID = VADialog.getNewID("vadialog-iframe-container");
				$('body').append(
					$('<div />', {
						id: dialogID,
						hidden: true,
						'data-vadialog-iframe-trigger': elem.id
					})
				);
			}
			return {
				triggerID: elem.id,
				dialogID:  dialogID
			};
		},
		beforeOpen: function(trigger){
			this.find('iframe').remove();
			var f = $('<iframe />', {
				src: $(trigger).attr('href'),
				tabindex: "0",
				width: "100%",
				height: "100%"
			});
			this.find('[data-vadialog-iframe-trigger]').append(f);
			VADialog.Dialog.resize(
				this,
				$(window).innerWidth(),
				$(window).innerHeight()
			);
		},
		afterOpen: function(trigger){
			var padLeft  = parseInt($(this).css("padding-left"), 10);
			var padTop   = parseInt($(this).css("padding-top"), 10);
			$(this).find('iframe').width(
				window.innerWidth - (2 * padLeft)
			).height(
				window.innerHeight - (2 * padTop)
			);
			VADialog.Dialog.resize(this);
			$('.vashadow').addClass('vashadow-iframe');
		},
		forCloseButton: function(trigger){
			this.find('iframe').remove();
		}
	};

	// Trigger actions for particular link types
	var triggerActions = {
		open: function(){
			if (!this.id) {
				this.id = VADialog.getNewID("vadialog-trigger");
			}
			var triggerID = this.id,
			dialogID = this.getAttribute('data-vadialog-open');

			VADialog.addDialog(
				triggerID,
				dialogID
			);
		},
		close: function(){
			$(this).click(function(e){
				e.preventDefault();
				VADialog.closeDialog(
					this.getAttribute('data-vadialog-close')
				);
			});
		},
		url: function(){
			var idents = UrlTrigger.setup(this);
			VADialog.addDialog(
				idents.triggerID,
				idents.dialogID,
				{
					beforeOpen: UrlTrigger.beforeOpen,
					forCloseButton: UrlTrigger.forCloseButton
				}
			);
		},
		iframe: function(){
			var idents = IframeTrigger.setup(this);
			VADialog.addDialog(
				idents.triggerID,
				idents.dialogID,
				{
					beforeOpen: IframeTrigger.beforeOpen,
					afterOpen: IframeTrigger.afterOpen,
					forCloseButton: IframeTrigger.forCloseButton
				}
			);
		}
	}

	 // jQuery Plugin interface
	$.fn.vadialog = function() {
		var triggers = {
			open:   $('[data-vadialog-open]', this),
			close:  $('[data-vadialog-close]', this),
			url:    $('[data-vadialog-url]', this),
			iframe: $('[data-vadialog-iframe]', this)
		};

		VADialog.escapeToClose();

		for (var i in triggers) {
			triggers[i].each(function(){
				triggerActions[i].call(this);
			});
		}
	};

	$(document).ready(function(){
		$('body').vadialog();
	});
}( jQuery ));