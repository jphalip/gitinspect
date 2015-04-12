About Gitinspect
================

Gitinspect is a small Mac app built with [Atom-Shell](https://github.com/atom/atom-shell)
and [ReactJS](http://facebook.github.io/react/). Currently its main purpose is
to locate the largest files in a given Git repository's history. This is
useful if you'd like to then remove such large files from your repository using
a tool like [BFG Repo-Cleaner](http://rtyley.github.io/bfg-repo-cleaner/).

More features may be added in the future.

Currently it is Mac-only. It should be fairly simple to enable it on other
platforms. If you'd like to contribute support for other platforms, please
consider submitting pull requests.

Screenshots
===========

![Screenshot of the file list](https://raw.githubusercontent.com/jphalip/gitinspect/master/screenshots/file-list.png)

![Screenshot of the detail window](https://raw.githubusercontent.com/jphalip/gitinspect/master/screenshots/detail-window.png)

Building the development environment
====================================

You will first have to install node and npm. Then follow these steps:

    $ npm install
    $ grunt download-atom-shell
    $ cd app
    $ npm install
    $ cd ..

Running the app
===============

    $ ./build/Atom.app/Contents/MacOS/Atom app

Contributing
============

Feedback and pull requests are welcome. Feel free to get in touch: [@julienphalip](https://twitter.com/julienphalip).

License
=======

BSD 2 "Simplified".