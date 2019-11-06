const app = function () {
    const base_dir = (location.pathname.replace('/index.html', '/') + "/files/").replace(/\/\//g, '/'),
        IMAGE_EXTENSIONS = ['bmp', 'gif', 'jpg', 'jpeg', 'jpe', 'png'],
        AUDIO_EXTENSIONS = ['ogg', 'opus', 'aac', 'm4a', 'mp3', 'flac', 'caf'],
        ARCHIVE_EXTENSIONS = ['tar', 'zip', 'rar', '7z', 'gz', 'bz2', 'xz', 'lzma'],
        IGNORED_ELEMENTS = ['../', 'Name', 'Last modified', 'Size', 'Description', 'Parent Directory'],
        CODE_EXTENSIONS = ['js', 'html', 'css', 'cpp', 'c', 'h', 'hpp', 'tex', 'sh'],
        COMPILE_FILES = ['Makefile'],
        COMPILE_EXTENSIONS = ['cmake'],
        TEXT_EXTENSIONS = ['md', 'txt', 'rst'],
        CONFIG_EXTENSIONS = ['toml', 'yaml', 'json', 'conf', 'cfg', 'ini', 'yml'],
        VIDEO_EXTENSIONS = ['mkv', 'mp4'];

    let current_dir = (base_dir + location.hash.substring(1) + '/').replace(/\/\//g, '/'),
        imgCache = [],
        prev_img = "",
        next_img = "";

    // gets extension (suffix) of file name or file pointed to by path
    function getExt(path) {
        return path.split('.').pop().toLowerCase();
    }

    function isSomething(name, thing) {
        return $.inArray(name, thing) !== -1;
    }

    // check if the given path points to an image
    function isImage(path) {
        return isSomething(getExt(path), IMAGE_EXTENSIONS);
    }

    // check if the given path points to a folder
    function isFolder(path) {
        return path.slice(-1) === '/';
    }

    // initialise tile
    function initTile(href, name) {
        const icon_span = document.createElement('span'),
            icon = document.createElement('i'),
            title = document.createElement('span'),
            tile = document.createElement('a');

        // doesn't work for folders
        // const max_len = 30;
        // if (moniker.length > max_len) {
        //     console.log(moniker.slice(0, max_len - 3) + '...');
        //     moniker = moniker.slice(0, max_len - 3) + '...';
        // }

        tile.href = href + name;

        icon.className = "fas fa-folder";
        icon.setAttribute('aria-hidden', 'true');
        icon_span.appendChild(icon);
        tile.appendChild(icon_span);

        title.innerText = decodeURIComponent(name.slice(0, -1));
        tile.appendChild(title);

        return [icon, tile];
    }

    // create a folder tile
    function createFolderTile(href, name) {
        [icon, tile] = initTile(href, name);
        icon.className = "fas fa-folder";
        return tile;
    }

    // create a file tile
    function createFileTile(href, name) {
        [icon, tile] = initTile(href, name);

        if (isImage(name)) {
            icon.className = "fas fa-image";
        } else if (isSomething(getExt(name), AUDIO_EXTENSIONS)) {
            icon.className = "fas fa-audio";
        } else if (isSomething(getExt(name), ARCHIVE_EXTENSIONS)) {
            icon.className = "fas fa-file-archive";
        } else if (isSomething(getExt(name), CODE_EXTENSIONS)) {
            icon.className = "fas fa-code";
        } else if (isSomething(getExt(name), VIDEO_EXTENSIONS)) {
            icon.className = "fas fa-video";
        } else if (isSomething(getExt(name), TEXT_EXTENSIONS)) {
            icon.className = "fas fa-file-signature";
        } else if (getExt(name) === 'pdf') {
            icon.className = "fas fa-file-pdf";
        } else if (isSomething(getExt(name), CONFIG_EXTENSIONS)) {
            icon.className = "fas fa-cog";
        } else if (isSomething(name, COMPILE_FILES) || isSomething(getExt(name), COMPILE_EXTENSIONS)) {
            icon.className = "fas fa-hammer";
        } else if (getExt(name) === 'py') {
            icon.className = "fab fa-python";
        } else if (getExt(name) === 'torrent') {
            icon.className = "fas fa-file-download";
        } else {
            icon.className = "fas fa-file";
        }

        return tile;
    }

    // cache an image for future usage
    function cacheImage(file) {
        for (let i = 0; i < imgCache.length; i++) {
            if (imgCache[i].src === file) return;
        }
        imgCache.push(file);
    }

    // check if file should be displayed as tile
    function isValidTile(name) {
        return !(name.charAt(0) === "." || isSomething(name, IGNORED_ELEMENTS));
    }

    // load the contents of the given directory
    function cd(dir) {
        current_dir = decodeURIComponent(dir);

        location.hash = current_dir.replace(base_dir, '');

        // show the location bar
        $(".current-dir").text('');
        const path = current_dir.replace(base_dir, '/').split('/');
        let temp_path = "";
        for (let i = 0; i < path.length - 1; i++) {
            const sub_path = document.createElement('a');
            temp_path += path[i] + '/';
            $(sub_path).text(path[i] + '/');
            sub_path.title = base_dir + temp_path.substring(1);
            $(sub_path).on("click", function () {
                cd(this.title);
            });
            $(".current-dir").append(sub_path);
        }

        // retrieve the contents of the directory
        $.get(current_dir, function (data) {
            const html = $.parseHTML(data);
            $(".browser-view").html("");

            // create tiles for folders
            $(html).find("a").each(function (i, element) {
                const name = element.getAttribute('href');
                if (isFolder(name) && isValidTile(name)) {
                    $(".browser-view").append(
                        createFolderTile(current_dir, name));
                }
            });

            // create tiles for files
            $(html).find("a").each(function (i, element) {
                const name = element.getAttribute('href');
                if (!isFolder(name) && isValidTile(name)) {
                    $(".browser-view").append(
                        createFileTile(current_dir, name));
                }
            });

            // add events to tiles
            $(".browser-view a").each(function (i, element) {
                if (isFolder(element.pathname)) {
                    // open directories
                    $(element).on("click", function (e) {
                        e.preventDefault();
                        cd(element.pathname);
                    });
                } else if (isImage(element.pathname)) {
                    // show image previews
                    $(element).on("click", function (e) {
                        e.preventDefault();
                        showPreview(element.pathname);
                    });
                }
            });
        });
    }

    // show an image preview of the given file
    function showPreview(filepath) {
        $(".bg-translucent").css('display', 'block');
        $(".file-view-img").css('padding-top', '2em');
        $(".file-view-img").attr('src', 'loader.gif');
        $(".file-view-wrapper").css('display', 'block');
        const img = new Image();
        img.src = filepath;
        img.onload = function () {
            $(".file-view-img").fadeOut(0);
            $(".file-view-img").css('padding-top', '0');
            $(".file-view-img").attr('src', filepath);
            $(".file-view-img").fadeIn();
            const scale_width = 0.8 * $(window).width() / img.width,
                scale_height = 0.8 * $(window).height() / img.height,
                imgWidth = img.width * Math.min(scale_width, scale_height),
                imgHeight = img.height * Math.min(scale_width, scale_height);
            $(".file-view-wrapper").css('left', ($(document).width() - imgWidth) / 2);
            $(".file-view-wrapper").css('width', imgWidth);
            $(".file-view-wrapper").css('height', imgHeight);
            $(".file-view-prev").css('display', 'block');
            $(".file-view-next").css('display', 'block');
        };
        cacheImage(filepath);

        // search for the previous and next image to be displayed
        let first_img = "",
            last_img = "",
            img_found = false;
        prev_img = "";
        next_img = "";
        $(".browser-view a").each(function (i, element) {
            if (isImage(element.pathname)) {
                if (first_img === "") {
                    first_img = element.pathname;
                }
                if (img_found && next_img === "") {
                    next_img = element.pathname;
                }
                if (element.pathname === filepath) {
                    img_found = true;
                }
                if (!img_found) {
                    prev_img = element.pathname;
                }
                last_img = element.pathname;
            }
        });
        if (next_img === "") {
            next_img = first_img;
        }
        if (prev_img === "") {
            prev_img = last_img;
        }
    }

    // close the image preview
    function closePreview() {
        $(".bg-translucent").css('display', 'none');
        $(".file-view-wrapper").css('display', 'none');
    }

    // add various event handlers
    $('.file-view-prev').on("click", function () {
        showPreview(prev_img);
    });
    $('.file-view-next').on("click", function () {
        showPreview(next_img);
    });
    $("body").on("keydown", function (event) {
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
    $('.base-dir-icon').on("click", function () {
        cd(base_dir);
    });

    cd(current_dir);
}();
