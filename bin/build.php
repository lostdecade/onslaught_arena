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

$chrome_tpl = file_get_contents("{$root}template/chrome_app.template.html");
$web_tpl = file_get_contents("{$root}template/web.template.html");

$chrome_tpl = str_replace('{{GAME_CODE}}', $js, $chrome_tpl);
$web_tpl = str_replace('{{GAME_CODE}}', $js, $web_tpl);

exec("rm -rf {$root}/build");
exec("mkdir {$root}/build");

// Chrome
exec("mkdir {$root}/build/chrome");
file_put_contents("{$root}/build/chrome/index.html", $chrome_tpl);
exec("cp -r {$root}htdocs/img {$root}build/chrome/");
exec("cp -r {$root}htdocs/sound {$root}build/chrome/");
exec("cp -r {$root}htdocs/css {$root}build/chrome/");
exec("cp -r {$root}htdocs/lib {$root}build/chrome/");
exec("cp -r {$root}htdocs/manifest.json {$root}build/chrome/");

// TODO: Compress chrome code into zip

// Web
exec("mkdir {$root}/build/web");
file_put_contents("{$root}build/web/index.html", $web_tpl);
exec("cp -r {$root}htdocs/img {$root}build/web/");
exec("cp -r {$root}htdocs/css {$root}build/web/");
exec("cp -r {$root}htdocs/sound {$root}build/web/");
exec("cp -r {$root}htdocs/favicon.ico {$root}build/web/");
exec("cp -r {$root}htdocs/robots.txt {$root}build/web/");
exec("cp -r {$root}htdocs/lib {$root}build/web/");

// Cleanup
unlink("{$root}horde.js");
