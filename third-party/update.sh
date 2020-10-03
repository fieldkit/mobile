#!/bin/bash

set -xe

echo updating third-party from `pwd`...

SOURCE=../NativeScript-Drop-Down
if [ -d $SOURCE ]; then
    SOURCE=$(cd $SOURCE; pwd)
    pushd $SOURCE
    grunt build
    popd

    pushd third-party
    rm -rf nativescript-drop-down
    mkdir nativescript-drop-down
    cp -ar $SOURCE/bin/dist/* nativescript-drop-down
    popd
fi

SOURCE=../nativescript-conservify
if [ -d $SOURCE ]; then
	pushd $SOURCE
    ./update-android.sh
	popd

    SOURCE=$(cd $SOURCE; pwd)
    pushd $SOURCE/publish
    ./pack.sh
    popd

    pushd third-party
    rm -rf nativescript-conservify
    mkdir nativescript-conservify
    tar xf $SOURCE/publish/package/*.tgz --strip 1 -C nativescript-conservify
    popd
fi
