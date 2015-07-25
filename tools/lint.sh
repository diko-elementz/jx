#!/bin/sh

CURRENT=$0
CWD=$(readlink -m "$CURRENT/../source")


gjslint --disable 0001 -r "$CWD"
