#!/bin/bash

BASE_NAME=$1
if [ -z "$BASE_NAME" ]; then
	echo "mkm.sh title_of_migration"
	exit 2
fi

APP=FieldKit
TIME=`date "+%Y%m%d_%H%M%S"`
FN=${TIME}_${BASE_NAME}.js
CLASS_NAME=${BASE_NAME}_${TIME}

cp ${APP}/app/migrations/{new_migration.js.template,${FN}}


kernelName="$(uname -s)"
case "${kernelName}" in
    Darwin*)
		sed -i '' "s/{MIGRATION_NAME}/${CLASS_NAME}/g" ${APP}/app/migrations/${FN};;
    Linux*)
		sed -i "s/{MIGRATION_NAME}/${CLASS_NAME}/gI" ${APP}/app/migrations/${FN};;
esac

rm ${APP}/app/migrations/index.js

for f in ${APP}/app/migrations/2020*.js; do
	FN=`basename $f`
	echo "export * from './${FN}';" >>  ${APP}/app/migrations/index.js
done
