#!/usr/bin/php
<?php

define('ROOT', dirname(__FILE__) . '/../');
define('CLOSURE_COMPILER', '~/closure_compiler/compiler.jar');

// Grab the version, increment it and write it back to disk
function getVersion () {
	$version_file = ROOT . 'version.json';
	$v = json_decode(file_get_contents($version_file));
	$v->build++;
	file_put_contents($version_file, json_encode($v));
	return "{$v->major}.{$v->minor}.{$v->build}";
}

// Build setup
function setup () {
	$build_dir = ROOT . 'build';
	exec("rm -rf {$build_dir}");
	exec("mkdir {$build_dir}");
}

// Cleanup
function cleanup () {
	unlink(ROOT . 'horde.js');
}

// Compile a bunch of JS files
function compileJS ($files, $target) {
	$command = 
		'java -jar ' . CLOSURE_COMPILER . 
		" --js_output_file {$target}" .
		' --compilation_level SIMPLE_OPTIMIZATIONS';
	foreach ($files as $filename) {
		$command .= " --js {$filename}";
	}
	exec($command);
}

// Build the web version
function buildWeb ($version) {
	$compiled_js = file_get_contents(ROOT . 'horde.js');
	$tpl = file_get_contents(ROOT . 'template/web.template.html');
	$tpl = str_replace('{{GAME_CODE}}', $compiled_js, $tpl);
	$tpl = str_replace('{{VERSION}}', $version, $tpl);
	$web_root = ROOT . 'build/web/';
	$htdocs = ROOT . 'htdocs';
	exec("mkdir {$web_root}");
	file_put_contents("{$web_root}index.html", $tpl);
	exec("cp -r {$htdocs}/img {$web_root}");
	exec("cp -r {$htdocs}/css {$web_root}");
	exec("cp -r {$htdocs}/lib {$web_root}");
	exec("cp -r {$htdocs}/sound {$web_root}");
	exec("cp -r {$htdocs}/favicon.ico {$web_root}");
	exec("cp -r {$htdocs}/robots.txt {$web_root}");	
}

// Build the Chrome Web Store app
function buildChromeApp ($version) {
	$manifest_file = ROOT . 'chrome_web_store/manifest.json';
	$manifest = json_decode(file_get_contents($manifest_file));
	$manifest->version = $version;
	file_put_contents($manifest_file, json_encode($manifest));
}

// Source JavaScript files; order matters!
$js_dir = ROOT . 'htdocs/js';
$source_js = array(
	"{$js_dir}/base.js",
	"{$js_dir}/timer.js",
	"{$js_dir}/sound.js",
	"{$js_dir}/size.js",
	"{$js_dir}/vector2.js",
	"{$js_dir}/rect.js",
	"{$js_dir}/keyboard.js",
	"{$js_dir}/mouse.js",
	"{$js_dir}/engine.js",
	"{$js_dir}/object.js",
	"{$js_dir}/object_types.js",
	"{$js_dir}/image_loader.js",
	"{$js_dir}/spawn_point.js",
	"{$js_dir}/spawn_wave.js",
	"{$js_dir}/run_game.js"
);

$version = getVersion();
echo "Buidling Onslaught! Arena v{$version}\n";

echo "Compiling JavaScript...\n";
compileJS($source_js, ROOT. 'horde.js');

setup();

echo "Building web version...\n";
buildWeb($version);

echo "Building Chrome Web Store app...\n";
buildChromeApp($version);

cleanup();

echo "Done!\n";
