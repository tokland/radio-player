#!/bin/bash
set -e -u

debug() { echo "$@" >&2; }

convert_image() {
	local source_image=$1
	local filename format
	declare -A sizes=(
		[mdpi]=48
		[hdpi]=72
		[xhdpi]=96
		[xxhdpi]=144
	)

	filename=$(basename "$source_image")
	for format in ${!sizes[*]}; do
		local size=${sizes[$format]}
		local output_path="android/app/src/main/res/mipmap-$format/$filename"
		debug "$source_image -> size=${size} -> $output_path"
		convert $source_image -resize "${size}x${size}" $output_path
	done
}

for FILE in "$@"; do
	convert_image "$FILE"
done