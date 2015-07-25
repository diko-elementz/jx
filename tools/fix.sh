#!/bin/sh

#!/bin/sh
CURRENT=$0
CWD=$(readlink -m "$0/../../source")

#js-beautify -r -a source/Jx.js

find "$CWD" -type f | while read line; do
   echo "beautifying $line"
   js-beautify -r -a -n -w 80 "$line"
done
