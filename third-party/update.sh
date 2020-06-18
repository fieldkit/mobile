#!/bin/bash

set -xe

echo updating third-party from `pwd`...

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
