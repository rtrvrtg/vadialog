/**
 * VA Dialog
 * v0.1.1.0
 */

$(document).ready(function(){

  // Accessible modal triggers
  var vadialogOpenTriggers = $('[data-vadialog-open]'),
  vadialogCloseTriggers    = $('[data-vadialog-close]'),
  vadialogUrlTriggers      = $('[data-vadialog-url]'),
  vadialogIframeTriggers   = $('[data-vadialog-iframe]');

  visionaustralia.escapeToClose();

  // Normal popup window open
  vadialogOpenTriggers.each(function(){
    if (!this.id) {
      this.id = visionaustralia.getNewID("vadialog-trigger");
    }
    var triggerID = this.id,
    dialogID = this.getAttribute('data-vadialog-open');
    visionaustralia.addDialog(
      triggerID,
      dialogID
    );
  });

  // Normal popup window close
  vadialogCloseTriggers.click(function(e){
    e.preventDefault();
    visionaustralia.closeDialog(
      this.getAttribute('data-vadialog-close')
    );
  });

  // Open to URL
  vadialogUrlTriggers.each(function(){
    var trigger = this,
    dialogID = null,
    selector = $(trigger).attr('data-vadialog-url');
    if (!trigger.id) {
      trigger.id = visionaustralia.getNewID("vadialog-url-trigger");
    }
    if ($('[data-vadialog-url-trigger="' + trigger.id + '"]').length) {
      dialogID = $('[data-vadialog-url-trigger="' + trigger.id + '"]').attr('id');
    }
    else {
      dialogID = visionaustralia.getNewID("vadialog-url-container");
      $('body').append(
        $('<div />', {
          id: dialogID,
          hidden: true,
          'data-vadialog-url-trigger': trigger.id
        })
      );
    }
    visionaustralia.addDialog(
      trigger.id,
      dialogID,
      {
        beforeOpen: function(){
          var container = this;
          var loadContainer = $('<div />', {
            'class': "remote-content remote-content-loading",
            'html': '<div class="remote-content-inner"><i class="fa fa-spinner"></i></div>',
            'aria-live': "polite"
          });
          container.append(loadContainer);
          container.find('.remote-content')
          .load($(trigger).attr('href') + " body", function(response, status, xhr){
            if (status == "error") {
              var html = $('<div class="remote-content-inner"><i class="fa fa-exclamation-triangle"></i><p role="alert">Could not load page.</p></div>');
              $(this).children().remove();
              $(this).append(html)
              .removeClass('remote-content-loading')
              .addClass('remote-content-failedload');
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
              $(this).children().remove();
              $(this).append(html)
              .removeClass('remote-content-loading');
            }
            visionaustralia.resizeDialog(container);
          });
          visionaustralia.resizeDialog(container);
        },
        forCloseButton: function(){
          this.find('.remote-content').remove();
        }
      }
    );
  });
  
  // Open to Iframe
  vadialogIframeTriggers.each(function(){
    var trigger = this, dialogID = null;
    if (!trigger.id) {
      trigger.id = visionaustralia.getNewID("vadialog-iframe-trigger");
    }
    if ($('[data-vadialog-iframe-trigger="' + trigger.id + '"]').length) {
      dialogID = $('[data-vadialog-iframe-trigger="' + trigger.id + '"]').attr('id');
    }
    else {
      dialogID = visionaustralia.getNewID("vadialog-iframe-container");
      $('body').append(
        $('<div />', {
          id: dialogID,
          hidden: true,
          'data-vadialog-iframe-trigger': trigger.id
        })
      );
    }
    visionaustralia.addDialog(
      trigger.id,
      dialogID,
      {
        beforeOpen: function(){
          this.find('iframe').remove();
          var f = $('<iframe />', {
            src: $(trigger).attr('href'),
            tabindex: "0",
            width: "100%",
            height: "100%"
          });
          this.find('[data-vadialog-iframe-trigger]').append(f);
          visionaustralia.resizeDialog(
            this,
            $(window).innerWidth(),
            $(window).innerHeight()
          );
        },
        afterOpen: function(){
          var padLeft  = parseInt($(this).css("padding-left"), 10);
          var padTop   = parseInt($(this).css("padding-top"), 10);
          $(this).find('iframe').width(
            window.innerWidth - (2 * padLeft)
          ).height(
            window.innerHeight - (2 * padTop)
          );
          visionaustralia.resizeDialog(this);
          $('.vashadow').addClass('vashadow-iframe');
        },
        forCloseButton: function(){
          this.find('iframe').remove();
        }
      }
    );
  });
});