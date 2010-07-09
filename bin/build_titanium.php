#!/usr/bin/php
<?php

// THIS ONLY WORKS ON OSX!!!
echo "Building Onslaught! for Titanium Desktop (OSX)\n";
echo "THIS SCRIPT ONLY WORKS ON OSX FOR NOW!!\n\n";

$root = dirname(__FILE__) . '/../';

$ti_path = '/Library/Application\ Support/Titanium/';
$ti_sdk_path = "{$ti_path}sdk/osx/1.0.0/";

/*
./tibuild.py -d ~/dev/onslaught/ -s /Library/Application\ Support/Titanium -a /Library/Application\ Support/Titanium/sdk/osx/1.0.0/ ~/dev/onslaught/titanium/ -t bundle -n
*/

exec("cp -r {$root}htdocs/ {$root}titanium/Resources/");

exec("{$ti_sdk_path}tibuild.py -d {$root}/titanium/dist/osx/ -s {$ti_path} -a {$ti_sdk_path} {$root}titanium/ -t bundle -n");
