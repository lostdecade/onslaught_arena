#!/usr/bin/php
<?php

$root = dirname(__FILE__) . '/../';

$source_js = array(
	'base.js',
	'timer.js',
	'sound.js',
	'size.js',
	'vector2.js',
	'rect.js',
	'keyboard.js',
	'mouse.js',
	'engine.js',
	'object.js',
	'object_types.js',
	'image_loader.js',
	'spawn_point.js',
	'spawn_wave.js',
	'run_game.js'
);

$command = 
	'java -jar ~/closure_compiler/compiler.jar '
	. "--js_output_file {$root}horde.js "
	. '--compilation_level SIMPLE_OPTIMIZATIONS ';

foreach ($source_js as $filename) {
	$command .= "--js {$root}htdocs/js/{$filename} ";
}

// Compile!
exec($command);

$js = file_get_contents("{$root}horde.js");

//$ti_tpl = file_get_contents("{$root}template/titanium.template.html");
$web_tpl = file_get_contents("{$root}template/web.template.html");

//$ti_tpl = str_replace('{{GAME_CODE}}', $js, $ti_tpl);
$web_tpl = str_replace('{{GAME_CODE}}', $js, $web_tpl);

// Titanium
/*
file_put_contents("{$root}titanium/Resources/index.html", $ti_tpl);
exec("cp -r {$root}htdocs/img {$root}titanium/Resources/");
exec("cp -r {$root}htdocs/sound {$root}titanium/Resources/");
exec("cp -r {$root}htdocs/css {$root}titanium/Resources/");
*/

// Web
file_put_contents("{$root}web/index.html", $web_tpl);
exec("cp -r {$root}htdocs/img {$root}web/");
exec("cp -r {$root}htdocs/css {$root}web/");
exec("cp -r {$root}htdocs/sound {$root}web/");
exec("cp -r {$root}htdocs/favicon.ico {$root}web/");
exec("cp -r {$root}htdocs/robots.txt {$root}web/");
exec("cp -r {$root}htdocs/lib {$root}web/");

// Cleanup
unlink("{$root}horde.js");
