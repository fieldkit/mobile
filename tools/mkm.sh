#!/bin/bash

BASE_NAME=$1
if [ -z "$BASE_NAME" ]; then
	echo "mkm.sh title_of_migration"
	exit 2
fi

TIME=`date "+%Y%m%d_%H%M%S"`
FN=${TIME}_${BASE_NAME}.ts
CLASS_NAME=${BASE_NAME}_${TIME}

cp app/migrations/{new_migration.ts.template,${FN}}


kernelName="$(uname -s)"
case "${kernelName}" in
    Darwin*)
		sed -i '' "s/{MIGRATION_NAME}/${CLASS_NAME}/g" app/migrations/${FN};;
    Linux*)
		sed -i "s/{MIGRATION_NAME}/${CLASS_NAME}/gI" app/migrations/${FN};;
esac

rm app/migrations/index.js

for f in app/migrations/2020*; do
	FN=`basename $f`
	echo "export * from './${FN}';" >> app/migrations/index.js
done
