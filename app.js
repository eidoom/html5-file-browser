var app = function(){
  var base_dir = (location.pathname.replace('/index.html', '/') +
                  "/files/").replace(/\/\//g, '/');
  var current_dir = (base_dir + location.hash.substring(1) +
                     '/').replace(/\/\//g, '/');
  var IMG_EXTENSIONS = ['bmp', 'gif', 'jpg', 'jpeg', 'jpe', 'png'];
  var IGNORED_ELEMENTS = ['../', 'Name', 'Last modified', 'Size', 'Description',
                          'Parent Directory'];
  var imgCache = [];
  var prev_img = "";
  var next_img = "";

  // check if the given path points to an image
  function isImage(path) {
    return $.inArray(path.split('.').pop().toLowerCase(), IMG_EXTENSIONS) !== -1;
  }

  // check if the given path points to a folder
  function isFolder(path) {
    return path.slice(-1) === '/';
  }

  // create a tile
  function createTile(href, name) {
    var icon_span = document.createElement('span'),
        icon = document.createElement('i');
    var title = document.createElement('span');
    var tile = document.createElement('a');
    if (isFolder(name)) {
		moniker = name.slice(0,-1);
        icon.className = "fas fa-folder";
	} else {
		moniker = name;
	    if (isImage(name)) {
	    	icon.className = "fas fa-file-image";
        } else {
            icon.className = "fas fa-file";
    	}
	}
    icon.setAttribute('aria-hidden', 'true');
    icon_span.appendChild(icon);

    title.innerText = decodeURIComponent(moniker);

    tile.href = href+name;
    tile.appendChild(icon_span);
    tile.appendChild(title);
    return tile;
  }

  // cache an image for future usage
  function cacheImage(file) {
    for (var i=0; i<imgCache.length; i++) {
      if (imgCache[i].src === file) return;
    }
    imgCache.push(file);
  }

  // check if file should be displayed as tile
  function isValidTile(name) {
    if (name.charAt(0) !== ".") {
        return $.inArray(name, IGNORED_ELEMENTS) === -1;
    }
  }

  // load the contents of the given directory
  function cd(dir) {
    current_dir = decodeURIComponent(dir);

    location.hash = current_dir.replace(base_dir, '');

    // show the location bar
    $(".current-dir").text('');
    var path = current_dir.replace(base_dir, '/').split('/');

    var temp_path = "";
    for (var i=0; i<path.length-1; i++) {
      var sub_path = document.createElement('a');
      temp_path += path[i] + '/';
      $(sub_path).text(path[i] + '/');
      sub_path.title = base_dir + temp_path.substring(1);
      $(sub_path).on("click", function(){
        cd(this.title);
      });
      $(".current-dir").append(sub_path);
    }

    // retrieve the contents of the directory
    $.get(current_dir, function(data) {
      html = $.parseHTML(data);
      $(".browser-view").html("");

      // create tiles
      $(html).find("a").each(function(i, element){
        if (isValidTile(element.getAttribute('href'))) {
          $(".browser-view").append(
            createTile(current_dir, element.getAttribute('href')));
        }
      });

      // add events to tiles
      $(".browser-view a").each(function(i, element){
        if (element.pathname.slice(-1) === "/" ) {
          // open directories
          $(element).on("click", function(e) {
            e.preventDefault();
            cd(element.pathname);
          });
        } else if (isImage(element.pathname)) {
          // show image previews
          $(element).on("click", function(e) {
            e.preventDefault();
            showPreview(element.pathname);
          });
        }
      });
    });
  }

  // show an image preview of the given file
  function showPreview(filepath){
    $(".bg-translucent").css('display', 'block');
    $(".file-view-img").css('padding-top', '2em');
    $(".file-view-img").attr('src', 'loader.gif');
    $(".file-view-wrapper").css('display', 'block');
    var img = new Image();
    img.src = filepath;
    img.onload = function() {
      $(".file-view-img").fadeOut(0);
      $(".file-view-img").css('padding-top', '0');
      $(".file-view-img").attr('src', filepath);
      $(".file-view-img").fadeIn();
      var scale_width = 0.8 * $(window).width() / img.width;
      var scale_height = 0.8 * $(window).height() / img.height;
      var imgWidth = img.width * Math.min(scale_width, scale_height);
      var imgHeight = img.height * Math.min(scale_width, scale_height);
      $(".file-view-wrapper").css('left', ($(document).width() - imgWidth) / 2);
      $(".file-view-wrapper").css('width', imgWidth);
      $(".file-view-wrapper").css('height', imgHeight);
      $(".file-view-prev").css('display', 'block');
      $(".file-view-next").css('display', 'block');
    };
    cacheImage(filepath);

    // search for the previous and next image to be displayed
    var first_img = "";
    var last_img = "";
    prev_img = "";
    next_img = "";
    var img_found = false;
    $(".browser-view a").each(function(i, element){
      if (isImage(element.pathname)) {
        if (first_img === "") first_img = element.pathname;
        if (img_found && next_img === "") { next_img = element.pathname; }
        if (element.pathname === filepath) img_found = true;
        if (!img_found) prev_img = element.pathname;
        last_img = element.pathname;
      }
    });
    if (next_img === "") next_img = first_img;
    if (prev_img === "") prev_img = last_img;
  }

  // close the image preview
  function closePreview() {
    $(".bg-translucent").css('display', 'none');
    $(".file-view-wrapper").css('display', 'none');
  }

  // add various event handlers
  $('.file-view-prev').on("click", function(){
    showPreview(prev_img);
  });
  $('.file-view-next').on("click", function(){
    showPreview(next_img);
  });
  $("body").on("keydown", function(event) {
    switch (event.which) {
      case 27: // ESC
        closePreview();
        break;
      case 37: // left arrow key
        showPreview(prev_img);
        break;
      case 39: // right arrow key
        showPreview(next_img);
        break;
    }
  });
  $(".bg-translucent").on("click", closePreview);
  $('.base-dir-icon').on("click", function(){
    cd(base_dir);
  });

  cd(current_dir);
}();
