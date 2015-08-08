#!/bin/sh

##################################
# main execution
##################################
main_exec() {

    clear

# setup paths
    # defaults
    ROOT=$(readlink -f $(dirname $0))
    MERGER="$ROOT/tools/merge.js"
    SOURCE="$ROOT/source/jx.js"
    TARGET="$ROOT/output/jx.js"

    if [ $# -gt 1 ]; then
        TARGET="$2"
    fi

    if [ $# -gt 0 ]; then
        SOURCE="$1"
    fi

# check softwares
    echo
    echo "#####################################"
    echo "# Checking Required Software:       #"
    echo "#####################################"

    check_required "nodejs" "https://nodejs.org/download" || return 1
    check_required "gjslint" "https://developers.google.com/closure/utilities/docs/linter_howto" || return 1
    check_required "uglifyjs" "https://github.com/mishoo/UglifyJS" || return 1

# check directories
    echo
    echo "#####################################"
    echo "# Checking Required Directories:    #"
    echo "#####################################"

    printf "* Checking if $SOURCE is readable ... "
    if ! check_directory_readable $(dirname "$SOURCE"); then
        echo "Failed."
        echo "[!] Unable to access $SOURCE\n"
        return 2

    elif ! check_file_readable "$SOURCE"; then
        echo "Failed."
        echo "[!] Unable to access $SOURCE\n"
        return 2

    fi
    echo "Ok"

    printf "* Checking if $TARGET is writable ... "
    if ! check_directory_writable $(dirname "$TARGET"); then
        echo "Failed."
        echo "[!] Unable to access $TARGET\n"
        return 2
    fi
    echo "Ok"

    printf "* Checking if has merger $MERGER ... "
    if [ ! -r "$MERGER" ]; then
        echo "Failed."
        echo "[!] Unable to access $MERGER\n"
        return 3
    fi
    echo "Ok"

# lint
    echo
    echo "#####################################"
    echo "# Build JS:                         #"
    echo "#####################################"
    echo
    echo "1. Linting with gjslint"
    js_lint "$SOURCE" || return 4

    echo
    echo "2. Merging with merge.js"
    js_merge "$MERGER" "$SOURCE" "$TARGET" || return 5

    echo
    echo "3. Minifying with uglifyjs"
    js_uglify "$TARGET" || return 6

    echo
    echo "*** Build Success ***"
    echo
    echo "    output file: $TARGET"
    echo "    minfied file:" $(ext_remove "$TARGET")".min.js"
    echo
    return 0
}





##################################
# check requirements
##################################
check_required() {
    printf "* Checking $1 installation... "
    if type "$1" > /dev/null 2>&1; then
        echo "Found."
        return 0
    fi

    echo "Not Found.\n"
    echo "[!] Unable to build. Please install $1 in order to proceed to build process.\n"
    echo "  downloads/documentation can be found at:"
    echo "    $2"
    echo
    return 1
}

##################################
# check directories
##################################
check_directory() {
    [ -n "$1" ] || return 1
    [ -d "$1" ] || return 2
    [ -w "$1" ] || return 3
    [ -r "$1" ] || return 4
    return 0
}

check_directory_writable() {
    [ -n "$1" ] || return 1
    [ -d "$1" ] || return 2
    [ -w "$1" ] || return 3
    return 0
}

check_directory_readable() {
    [ -n "$1" ] || return 1
    [ -d "$1" ] || return 2
    [ -r "$1" ] || return 4
    return 0
}

##################################
# check files
##################################
check_file() {
    [ -n "$1" ] || return 1
    [ -f "$1" ] || return 2
    [ -w "$1" ] || return 3
    [ -r "$1" ] || return 4
    return 0
}

check_file_writable() {
    [ -n "$1" ] || return 1
    [ -f "$1" ] || return 2
    [ -w "$1" ] || return 3
    return 0
}

check_file_readable() {
    [ -n "$1" ] || return 1
    [ -f "$1" ] || return 2
    [ -r "$1" ] || return 4
    return 0
}

##################################
# js file extensions
##################################
ext_add() {
    [ -n "$1" ] || return 1
    echo "$1" | sed -r 's/\.js$/.js/i'
    return 0
}

ext_remove() {
    [ -n "$1" ] || return 1
    echo "$1" | sed -r 's/\.js$//i'
    return 0
}

##################################
# lint
##################################
js_lint() {
    DIR=$(ext_remove "$1")

    # lint main file
    printf "    linting: $1 ... "
    if ! ERROR=$(gjslint --disable 0001 "$1" 2>&1); then
        echo "Failed.\n"
        echo "  [!] $ERROR"
        return 1
    fi
    echo "Ok."

    # continue if directory
    check_directory_readable "$DIR" || return 0

    find "$DIR" -regex ".*\.js" | while read file; do
        printf "    linting: $file ... "
        if ! ERROR=$(gjslint --disable 0001 "$file" 2>&1); then
            echo "Failed.\n"
            echo "  [!] $ERROR"
            return 1
        fi
        echo "Ok."
    done
    return 0
}

##################################
# merge
##################################
js_merge() {
    BASE=$(ext_remove "$3")
    MERGE_FILE="$BASE.js"

    printf "    merging package to: $3 ... "
    if ! ERROR=$(nodejs "$1" "$2" "$MERGE_FILE" 2>&1); then
        echo "Failed.\n"
        echo "  [!] $ERROR"
        return 1
    fi
    echo "Ok."

    # duplicate
    cp "$MERGE_FILE" "$BASE.min.js"

    return 0
}

##################################
# uglify
##################################
js_uglify() {
    BASE=$(ext_remove "$1")
    MIN_FILE="$BASE.min.js"
    printf "    minifying merged package: $1 ... "
    if ! ERROR=$(uglifyjs --overwrite "$MIN_FILE" 2>&1); then
        echo "Failed.\n"
        echo "  [!] $ERROR"
        return 1
    fi
    echo "Ok."
    return 0
}

main_exec $*
