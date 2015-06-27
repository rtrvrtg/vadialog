(function($){

//www.visionaustralia.org/digital-access-dialog
//define global object
if(!window.visionaustralia){
	window.visionaustralia = {};
}

// Generates a random ID string that looks like a GUID
// Good for assigning IDs to dynamic things or links that don't have IDs
window.visionaustralia.getNewID = function(prefix){
	if (!prefix) prefix = "";
	var S4 = function() {
    	return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
	};
	return prefix + "-" + (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
};

// Moved so it's usable elsewhere
window.visionaustralia.resizeDialog = function(dialog, widthHint, heightHint){
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

window.visionaustralia.addDialog = function (linkId, dialogId, events){

	var fBeforeOpen = null;
	if (!!events && !!events.beforeOpen) fBeforeOpen = events.beforeOpen;

	var fAfterOpen = null;
	if (!!events && !!events.afterOpen) fAfterOpen = events.afterOpen;

	var fForCloseButton = null;
	if (!!events && !!events.forCloseButton) fForCloseButton = events.forCloseButton;
	
	$(function(){
        //adds onclick handler to the link. Used when the content is already
		//event handlers are added inside this function, so scope is keept separate for each dialog box, YES.
		if (!linkId) return; //add console.log mersssage. OR throw error.
		if (!dialogId) return;
	
		//add event handler to link
		var triggerLink = $("#" + linkId);
		triggerLink.click(function(event) {
			open(this,event);
		});
				
		//gib z-index for shadow &  dialog box
		var bigZ = 16123456;
		//body children that we will add or change aria-hidden on
		var bodyChildren = [];
			
		var heading;
		
		var startDialog;
		
		//outside of open function as they are used by close
		var dialog;
		var shadow;
		var parent;
		var isOpen = false;
		var contentCopy;
		var body = $("body");

		function open(link, ev){
		
			if(isOpen){
				startDialog.focus();
				ev.preventDefault();
				return;
			}
			
			isOpen = true;
			
            //Note: .after() returns the link JQuery object - NOT the elements inserted
            
            //create JQuery objects
            shadow = $('<div class="vashadow"></div>');
            dialog = $('<div class="vadialog"></div>');

            dialog.attr('data-current-vadialog', dialogId);
            
            var closeButton = $('<button class="vaCloseButton">' +
            	// '&#xe000;' +
            	'<span class="vaOffscreen">Close dialog</span></button>');
			var startCentinel = $('<span class="vaOffscreen" tabindex="0"></span>');
			startDialog = $('<a class="vaOffscreen" tabindex="-1">Dialog start</a>');
			var endDialog = $('<span class="vaOffscreen" tabindex="-1">Dialog end</span>');
			var endCentinel = $('<span class="vaOffscreen" tabindex="0"></span>');
			
			startCentinel.focus(function() {
				startDialog.focus();
			});
			
			endCentinel.focus(function() {
				endDialog.focus();
			});

			dialog.append(startCentinel);
			dialog.append(startDialog);
            shadow.append(closeButton);
            
        	var content = $("#" + dialogId);
  			
			parent = content.parent();
            
            var contentToShow = content.clone(true);
            //copy to re-insert after dialog box was closed
            contentCopy = content.clone(true);
            
            content.remove();
            
            dialog.append(contentToShow);
            
            contentToShow.show();
            
            dialog.append(endDialog);
			dialog.append(endCentinel);

			if (fBeforeOpen && typeof fBeforeOpen == "function") {
				fBeforeOpen.call(dialog);
			}
			
			//add event handler to close button
			closeButton.click(function(){
				if (fForCloseButton && typeof fForCloseButton == "function") {
					fForCloseButton.call(dialog);
				}
				close();
			});
            
			var win = $(window);

			function centerDialog(){
				visionaustralia.resizeDialog(dialog);
			}
			win.resize(function(){
				centerDialog();
			});
			
			//Changed to use aria-live much of the above - how we build the dialog - stays the same
			//insert in DOM - it made ALL the difference for JAWS 10 to have these two lines down here!!!!!!!
			dialog.css("z-index",bigZ);
			closeButton.css("z-index", bigZ + 1);
			shadow.css("z-index",bigZ);
			
			//hide all top level elements & remember their aria-hidden status
			body.children().each(function () {
				var jQchild = $(this);
				
				var o = {};
				o.jqel = jQchild;

				if(jQchild.attr("aria-hidden") !== undefined){
					o.hadVal = true;
					o.originalVal = jQchild.attr("aria-hidden");
				}else{
					o.hadVal = false;
				}
				bodyChildren.push(o);
				//hide the child
				jQchild.attr("aria-hidden", "true");
			});

			shadow.append(dialog);
			body.append(shadow);

			// Added by GR
			// Stop body from scrolling behind modal
			body.addClass('hasvamodal');
			
            shadow.show();

			centerDialog();

			dialog.show();
			
			startDialog.focus();

			if (fAfterOpen && typeof fAfterOpen == "function") {
				fAfterOpen.call(dialog);
			}

			ev.preventDefault();
			
        }//end open ooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo
		
		
		function close(){
			if(!isOpen)return;
			isOpen = false;

			for(var i=0, c; c=bodyChildren[i]; i++){
				//if element originally had aria-hidden attribute, reinstate value
				if(c.hadVal){
					c.jqel.attr("aria-hidden",c.originalVal);
				//if no original aria-hidden, remove the attribute entirely
				}else{
					c.jqel.removeAttr("aria-hidden");
				}
			}

			dialog.remove();
			shadow.remove();
			parent.append(contentCopy);

			// Added by GR
			// Restore scrolling to body
			body.removeClass('hasvamodal');

			triggerLink.focus();
		}
		
		visionaustralia[dialogId] = {};
		visionaustralia[dialogId].closeDialog = close;
		
	});//end jQUERY on page load

}// end addDialog
	

visionaustralia.closeDialog = function (dialogId){
	visionaustralia[dialogId].closeDialog();
}

// Added by GR
// Hit escape to close all modals
visionaustralia.escapeToClose = function (){
	$(document).keydown(function(e){
		if (e.which == 27) {
			$('[data-current-vadialog]').each(function(){
				visionaustralia.closeDialog(
					$(this).attr('data-current-vadialog')
				);
			});
		}
	});
}


})(jQuery);