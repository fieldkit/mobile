#!/bin/bash

set -xe

echo updating third-party from `pwd`...

SOURCE=../../nativescript-conservify
if [ -d $SOURCE ]; then
    SOURCE=$(cd $SOURCE; pwd)
    pushd $SOURCE/publish
    ./pack.sh
    popd

    pushd third-party
    rm -rf nativescript-conservify
    mkdir nativescript-conservify
    tar xf $SOURCE/publish/package/*.tgz --strip 1 -C nativescript-conservify
    mv nativescript-conservify/platforms/android/{app-debug.aar,fk-networking.aar}
    popd
fi
