'use strict';

// Dependencies --------------------------------------------------------------
var app = require('app');
var BrowserWindow = require('browser-window');
var Menu = require('menu');
var dialog = require('dialog');
var shell = require('shelljs');
var humanize = require('humanize');


// Global variables ----------------------------------------------------------
var appVersion = '0.0.1';
var appName = 'Gitinspect';
var websiteURL = 'https://github.com/jphalip/gitinspect';
var appMenu = [
    {
        label: appName,
        submenu: [
            {
                label: 'About ' + appName,
                click: function() {
                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        buttons: ['OK'],
                        title: appName,
                        message: appName,
                        detail: 'Version ' + appVersion + '\nAuthor: Julien Phalip\nMore info at ' + websiteURL + '\nIcons from http://glyphicons.com'
                    });
                }
            },
            {
                label: 'Quit',
                accelerator: 'Command+Q',
                click: function() {
                    app.quit();
                }
            }
        ]
    }
];
var repoPath = null;  // Reference to the currently opened repository's path
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GC'ed.
var mainWindow = null;


// Utils ---------------------------------------------------------------------

function loadRepository(folder) {
    shell.exec('cd "' + folder + '" && git rev-parse --is-inside-work-tree', {silent:true}, function(code, output) {
        if (output.trim() == 'true') {
            // Notify the renderer that a new repository was selected
            repoPath = folder;
            var repoName = repoPath.match(/([^\/]*)\/*$/)[1];
            mainWindow.send('repoOpened', repoName);
            updateRepoSize();
        }
        else {
            dialog.showMessageBox(mainWindow, {
                type: "warning",
                buttons: ["OK"],
                title: "Error",
                message: "The selected folder is not a Git repository",
                detail: "Please try again."
            }, function() {
                // Re-display the open dialog
                showOpenDialog();
            });
        }
    });
}


function runCommand(description, command, callback) {
    // Run the given command in the shell
    if (process.env.DEBUG) {
        console.log('Command: (' + description + ') $ ' + command);
    }
    return shell.exec('cd "' + repoPath + '" && ' + command, {silent:true}, callback);
}


function runGit(description, command, callback) {
    return runCommand(description, 'git ' + command, callback);
}


function updateRepoSize() {
    // Calculate the size of the repository and notify the renderer
    runCommand('Calculate repository\'s size', 'du -sh .git | cut -f1', function(code, output) {
        mainWindow.send('sizeUpdated', output.trim());
    });
}


function getLargeFiles(numberOfFiles) {
    // Find the largest files in the repository's history and order them by size
    runGit('Compress repository', 'gc', function() {
        runGit('Find large files', 'verify-pack -v .git/objects/pack/pack-*.idx | egrep "^\\w+ blob\\W+[0-9]+ [0-9]+ [0-9]+$" | sort -k 3 -n -r | head -n ' + numberOfFiles, function(code, output){
            // Find the largest blobs
            output = output.split('\n');
            var largeFiles = [];
            for (var i = 0; i < output.length - 1; i++) {
                var file = output[i];
                if ((/^sort/).test(file)) {
                    // FIXME
                    // Sometimes the following spurious output is returned at the end:
                    //     sort: write failed: standard output: Broken pipe
                    //     sort: write error
                    // ... so we just ignore it. There must be a cleaner way of handling this issue.
                }
                else {
                    // Extract the blob's SHA and size from the output
                    var values = file.split(/[ ]+/);
                    var blobSHA = values[0];
                    var size = values[3];
                    largeFiles.push({
                        size: humanize.filesize(size),
                        blobSHA: blobSHA
                    });
                }
            }
            mainWindow.send('fileListUpdated', largeFiles);

            // Find file names associated with those blobs
            largeFiles.forEach(function(file) {
                var cmd = "git log --raw --all --no-abbrev | awk '$4 ~ /" + file.blobSHA + "/ && $5 ~ /A|M/{print $6; exit}'";
                runCommand('Find blob\'s corresponding file name', cmd, function (code, output) {
                    file.name = output;
                    mainWindow.send('fileListUpdated', largeFiles);
                });
            });

            // Find commit SHAs associated with those blobs
            largeFiles.forEach(function(file) {
                var cmd = "git log --raw --all --no-abbrev | awk '$1 ~ /^commit/{a=$0} $4 ~ /" + file.blobSHA + "/ && $5 = /A|M/{print a; exit}'";
                runCommand('Find blob\'s commit', cmd, function (code, output) {
                    file.commitSHA = output.split(/[ ]+/)[1];
                    mainWindow.send('fileListUpdated', largeFiles);
                });
            });

        });
    });
}

function showOpenDialog() {
    // Open a dialog so the user can select a Git repository
    dialog.showOpenDialog(mainWindow, {title: 'Open a repository', properties: ['openDirectory']}, function(folders) {
        if (typeof(folders) != 'undefined') {
            loadRepository(folders[0]);
        }
    });
}


// App setup -----------------------------------------------------------------

app.on('window-all-closed', function() {
    // Quit when all windows are closed.
    if (process.platform != 'darwin') {
        app.quit();
    }
});


app.on('ready', function() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: appName
    });

    // Verify that git and awk are installed on the host
    if (!shell.which('git') || !shell.which('awk')) {
        Menu.setApplicationMenu(Menu.buildFromTemplate(appMenu));
        mainWindow.loadUrl('file://' + __dirname + '/rendering/config-error.html');
        mainWindow.focus();
        return;
    }

    // Load the renderer
    mainWindow.loadUrl('file://' + __dirname + '/rendering/index.html');
    mainWindow.focus();

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // De-reference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    // Create the app menu --------------------------------------------------
    appMenu.push(
        {
            label: 'File',
            submenu: [
                {
                    label: 'Open',
                    accelerator: 'Command+O',
                    click: function() {
                        showOpenDialog();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Copy',
                    accelerator: 'Command+C',
                    selector: 'copy:'
                }
            ]
        }
    );
    if (process.env.DEBUG) {
        // Add some dev tools if the DEBUG environment variable is set
        appMenu.push(
            {
                label: 'Developer',
                submenu: [
                    {
                        label: 'Toggle DevTools',
                        accelerator: 'Alt+Command+I',
                        click: function () {
                            BrowserWindow.getFocusedWindow().toggleDevTools();
                        }
                    },
                    {
                        label: 'Reload',
                        accelerator: 'Command+R',
                        click: function () {
                            BrowserWindow.getFocusedWindow().reload();
                        }
                    }
                ]
            }
        );
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(appMenu));


    // Initialize IPC handlers to communicate with the renderer --------------

    require('ipc').on('getLargeFiles', function(event, numberOfFiles) {
        getLargeFiles(numberOfFiles);
    });

    require('ipc').on('showOpenDialog', function() {
        showOpenDialog();
    });

    require('ipc').on('getCommitDetails', function(event, commitSHA) {
        runGit('Load commit', 'show --name-status ' + commitSHA, function(code, output){
            event.sender.send('commitDetailsReceived', output);
        });
    });

});