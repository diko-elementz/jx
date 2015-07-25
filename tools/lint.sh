#!/bin/sh

CURRENT=$0
CWD=$(readlink -m "$0/../../source")

gjslint --disable 0001 -r "$CWD"

exit $?
