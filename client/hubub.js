// HubBub client code
// From: https://github.com/almost/hubbub/
// Copyright: Thomas Parslow 2014 (tom@almostobsolete.net)
// License: MIT

(function (hubbub) {
  "use strict";

  var defaults = {
    post: window.location.pathname
  };

  // Send a comment, reports success or failure to the callbacks
  function sendComment(options,  success, failure) {
    var endpoint = options.endpoint || defaults.endpoint,
        comment = options.comment || defaults.comment,
        metadata = options.metadata || defaults.metadata,
        post = options.post || defaults.post;
    
    var xmlhttp = new XMLHttpRequest();
    // TODO: Make this configurable!
    xmlhttp.open("POST", endpoint, true);
    xmlhttp.setRequestHeader("Content-type", "application/json");

    xmlhttp.onload = function (e) {
      if (xmlhttp.readyState === 4) {
        if (xmlhttp.status >= 200 && xmlhttp.status < 300) {
          var response = JSON.parse(xmlhttp.responseText);
          if (success) success(response);
        } else {
          if (failure) failure(xmlhttp);
        }
      }
    };
    
    xmlhttp.onerror = function (e) {
      failure(xmlhttp, e);
    };
    
    xmlhttp.send(JSON.stringify({metadata: metadata, comment: comment, post: post}));
  }
  
  // Send a comment given in the fields of a form in the DOM
  function sendForm(form, success, failure) {
    var metadata = {}, match;
    
    for (var i = 0; i < form.length; i++) {
      match = /^metadata_(.*)/.exec(form[i].name);
      if (match) {
        metadata[match[1]] = form[i].value;
      }
    }
    
    sendComment({endpoint: form.action, comment: form.comment.value, metadata: metadata}, success, failure);
  }
  
  // Trap all submit events and check for a data-hubbub attribute, if
  // one exists then send a comment from the form.
  function onSubmit (evt) {
    var form = evt.target;
    if (!form.getAttribute('data-hubbub')) {
      // These aren't the forms you're looking for
      return;
    }
    var previewContainer = document.querySelector(evt.target.getAttribute('data-hubbub'));
    evt.preventDefault();
    
    if (!form.comment) {
      // If there's no comment then just ignore the submit
      return;
    }

    // Add status class while we send
    form.className = form.className + " hubbub-sending";
    
    sendForm(form, success, failure);

    function removeClass() {
      form.className = form.className.split(' ').filter(function (cls) {
        return cls !== 'hubbub-sending';
      })
    }

    function success(response) {
      removeClass();
      // Clear the comment field
      form.comment.value = '';
      if (previewContainer) {
        var commentEl = document.createElement('div');
        commentEl.className = "hubbub-pending hubbub-added";
        commentEl.innerHTML = response.html;
        previewContainer.appendChild(commentEl);
        
        // Remove the hubbub-added class to allow CSS transitions to
        // work
        setTimeout(function () {
          commentEl.className = "hubbub-pending";
        }, 100);
      }
    }
    
    function failure(xmlhttp) {
      removeClass();
      alert("Failed to send comment.");
    }
  }

  document.addEventListener('submit', onSubmit);
  

  function hubub (form, pendingComments) {
    
    var form = document.querySelector('form[data-hubbub]');
    form.addEventListener('submit', function (evt) {
      evt.preventDefault();
      var comment = form.querySelector('[name=comment]').value;
      var name = form.querySelector('[name=name]').value;
      
      var xmlhttp = new XMLHttpRequest();
      // TODO: Make this configurable!
      xmlhttp.open("POST","https://hubbub.herokuapp.com/api/default/comments",true);
      xmlhttp.setRequestHeader("Content-type", "application/json");

      xmlhttp.onload = function (e) {
        if (xmlhttp.readyState === 4) {
          if (xmlhttp.status >= 200 && xmlhttp.status < 300) {
            var response = JSON.parse(xmlhttp.responseText);
            var commentsContainer = document.querySelector('[data-hubbub-pendingcomment]');         
            if (commentsContainer) {
              var commentEl = document.createElement('div');
              commentEl.innerHTML = response.html;
              commentsContainer.appendChild(commentEl);
            }
            alert("Comment sent!");
            form.querySelector('[name=comment]').value = "";
          } else {
            alert("Failed to send comment: " + xmlhttp.statusText);
          }
        }
      };
      xmlhttp.onerror = function (e) {
        alert("Failed to send comment: " + xmlhttp.statusText);
      };
      
      // TOOD: Get post path from canonical meta tag if it's present
      xmlhttp.send(JSON.stringify({metadata: {name: name}, comment: comment, post: window.location.pathname}));
    });
  }
  
  hubbub.defaults = defaults;
  hubbub.sendComment = sendComment;
  hubbub.sendForm = sendForm;
  
})(window.hubbub = {});
