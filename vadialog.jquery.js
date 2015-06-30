/**
 * VA Dialog
 * v0.1.3
 */

(function( $ ) {

	// Based on the original at
	// www.VADialog.org/digital-access-dialog
	// Namespace was originally called visionaustralia
	var VADialog = {};

	// Base structure for templating loader
	VADialog.Templates = {
		loadContainer: function(html){
			return $('<div />', {
				'class': "remote-content remote-content-loading",
				'html': html,
				'aria-live': "polite"
			});
		},
		loadingTpl: '<div class="remote-content-inner">Loading...</div>',
		errorTpl: '<div class="remote-content-inner"><p role="alert">Could not load page.</p></div>',

		shadowTpl: '<div class="vashadow"></div>',
		dialogTpl: '<div class="vadialog"></div>',
		closeButtonTpl: '<button class="vaCloseButton" tabindex="999999"><span class="vaOffscreen">Close dialog</span></button>',

		sentinelTpl: '<span class="vaOffscreen" tabindex="0"></span>',
		dialogStartTpl: '<a class="vaOffscreen" tabindex="-1">Dialog start</a>',
		dialogEndTpl:   '<span class="vaOffscreen" tabindex="-1">Dialog end</span>',
		closeProxyTpl:  '<span class="vaCloseProxy vaOffscreen" tabindex="0"></span>'
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

	// Resize dialog box to try and fit content into page
	VADialog.resizeDialog = function(dialog, widthHint, heightHint){
		// Added by GR
		// Reset width and height
		dialog.width('');
		dialog.height('');

		// Heavily modified by GR
		// Centers window with more respect to the size of the window
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
	};

	// Handlers for window
	VADialog.Window = {
		resize: function(dialog, enable){
			var resizeBehaviour = function(){
				VADialog.resizeDialog(dialog);
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
				toCopy: content.clone(true),
				toShow: content.clone(true)
			}
			content.remove();
			return clones;
		},
		reinstate: function(){

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

	// Add a dialog
	VADialog.addDialog = function (linkId, dialogId, events){
		if (!linkId || !document.getElementById(linkId)) {
			throw "Link ID is not valid";
		}
		if (!dialogId || !document.getElementById(dialogId)) {
			throw "Dialog ID is not valid";
		}

		var fBeforeOpen = null;
		if (!!events && !!events.beforeOpen) fBeforeOpen = events.beforeOpen;

		var fAfterOpen = null;
		if (!!events && !!events.afterOpen) fAfterOpen = events.afterOpen;

		var fForCloseButton = null;
		if (!!events && !!events.forCloseButton) fForCloseButton = events.forCloseButton;

		//adds onclick handler to the link. Used when the content is already
		//event handlers are added inside this function, so scope is keept separate for each dialog box, YES.
	
		
				
		// High z-index for shadow & dialog box.
		var bigZ = 16123456;
		// Specify children of <body> that we will add or change aria-hidden on.
		var bodyChildren = [];
			
		var heading;
		
		var startDialog;
		
		//outside of open function as they are used by close
		var dialog, shadow, parent;
		var isOpen = false;
		var cc;
		var body = $("body");

		function openDialog(link, ev){
		
			if(isOpen) {
				startDialog.focus();
				ev.preventDefault();
				return;
			}
			
			isOpen = true;
			
			//Note: .after() returns the link JQuery object - NOT the elements inserted
			
			//create JQuery objects
			shadow = $(VADialog.Templates.shadowTpl);
			dialog = $(VADialog.Templates.dialogTpl);

			dialog.attr('data-current-vadialog', dialogId);
			
			var closeButton   = $(VADialog.Templates.closeButtonTpl);
			var startCentinel = $(VADialog.Templates.sentinelTpl);
			var closeProxy    = $(VADialog.Templates.closeProxyTpl);
			startDialog       = $(VADialog.Templates.dialogStartTpl);
			var endDialog     = $(VADialog.Templates.dialogEndTpl);
			var endCentinel   = $(VADialog.Templates.sentinelTpl);
			
			startCentinel.focus(function() {
				startDialog.focus();
			});
			
			endCentinel.focus(function() {
				endDialog.focus();
			});

			endDialog.blur(function() {
				closeButton.focus();
			});

			closeProxy.focus(function(){
				closeButton.focus();
			});

			closeButton.blur(function(){
				startCentinel.focus();
			});

			dialog.append(startCentinel);
			dialog.append(startDialog);
			shadow.append(closeButton);

			cc = VADialog.Content.extract(dialogId);
			dialog.append(cc.toShow);
			cc.toShow.show().attr("aria-hidden", "false");
			
			dialog.append(endDialog);
			dialog.append(endCentinel);
			dialog.append(closeProxy);

			if (fBeforeOpen && typeof fBeforeOpen == "function") {
				fBeforeOpen.call(dialog, link);
			}
			
			//add event handler to close button
			closeButton.click(function(){
				if (fForCloseButton && typeof fForCloseButton == "function") {
					fForCloseButton.call(dialog, link);
				}
				closeDialog();
			});

			VADialog.Window.resize(dialog, true);
			
			//Changed to use aria-live much of the above - how we build the dialog - stays the same
			//insert in DOM - it made ALL the difference for JAWS 10 to have these two lines down here!!!!!!!
			dialog.css("z-index",bigZ);
			closeButton.css("z-index", bigZ + 1);
			shadow.css("z-index",bigZ);
			
			// Hide all top level elements & remember their aria-hidden status
			bodyChildren = VADialog.Body.hideChildren(body);

			shadow.append(dialog);
			body.append(shadow);

			// Added by GR
			// Stop body from scrolling behind modal
			body.addClass('hasvamodal');
			
			shadow.show();

			VADialog.resizeDialog(dialog);

			dialog.show();
			
			startDialog.focus();

			if (fAfterOpen && typeof fAfterOpen == "function") {
				fAfterOpen.call(dialog, link);
			}

			ev.preventDefault();
			
		}//end open ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
		
		
		function closeDialog(){
			if (!isOpen) return;
			isOpen = false;

			VADialog.Window.resize(dialog, false);
			VADialog.Body.showChildren(bodyChildren);

			dialog.remove();
			shadow.remove();

			var recoverParent = VADialog.Content.parentContainer(dialogId);
			recoverParent.append(cc.toCopy);

			// Added by GR
			// Restore scrolling to body
			body.removeClass('hasvamodal');

			triggerLink.focus();
		}

		// Add event handler to link
		var triggerLink = $("#" + linkId);
		triggerLink.click(function(event) {
			openDialog(this, event);
		});
		
		VADialog[dialogId] = {};
		VADialog[dialogId].closeDialog = closeDialog;
	};

	// Close a dialog
	VADialog.closeDialog = function (dialogId){
		VADialog[dialogId].closeDialog();
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
			var loadContainer = VADialog.Templates.loadContainer(
				VADialog.Templates.loadingTpl
			);
			var selector = trigger.getAttribute('data-vadialog-url');
			container.find('[data-vadialog-url-trigger]').append(loadContainer);
			container.find('.remote-content')
			.load($(trigger).attr('href') + " body", function(response, status, xhr){
				var html = "", classes = [];
				if (status == "error") {
					var html = VADialog.Templates.errorTpl;
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
				$(this).append($(html))
				.removeClass('remote-content-loading')
				.addClass(classes);
				VADialog.resizeDialog(container);
			});
			VADialog.resizeDialog(container);
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
			VADialog.resizeDialog(
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
			VADialog.resizeDialog(this);
			$('.vashadow').addClass('vashadow-iframe');
		},
		forCloseButton: function(trigger){
			this.find('iframe').remove();
		}
	};

	// Trigger actions for particular link types
	var triggerActions = {
		open:   function(){
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
		close:  function(){
			this.click(function(e){
				e.preventDefault();
				VADialog.closeDialog(
					this.getAttribute('data-vadialog-close')
				);
			});
		},
		url:    function(){
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