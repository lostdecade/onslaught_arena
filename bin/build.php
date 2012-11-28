#!/usr/bin/php
<?php

define('ROOT', dirname(__FILE__) . '/../');

// Grab the version, increment it and write it back to disk
function getVersion () {
	$version_file = ROOT . 'version.json';
	$v = json_decode(file_get_contents($version_file));
	//$v->build++;
	//file_put_contents($version_file, json_encode($v));
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
	//unlink(ROOT . 'horde_demo.js');
}

// Compile a bunch of JS files
function compileJS ($files, $target, $version, $demo = false) {
	$js = '';
	foreach ($files as $filename) {
		$js .= file_get_contents($filename);
	}
	$js = <<< JAVASCRIPT
(function () {
	{$js}
}());
JAVASCRIPT;
	if ($demo) {
		$js = str_replace('var DEMO = false;', 'var DEMO = true;', $js);
	}
	$js = str_replace('{{VERSION}}', $version, $js);
	file_put_contents(ROOT . 'tmp.js', $js);
	$command =
		'closure-compiler ' .
		" --js_output_file {$target}" .
		' --compilation_level SIMPLE_OPTIMIZATIONS' .
		' --js ' . ROOT . 'tmp.js';
	exec($command);
	unlink(ROOT . 'tmp.js');
}

// Build the web version
function buildWeb ($version) {
	// FULL
	$compiled_js = file_get_contents(ROOT . 'horde.js');
	$tpl = file_get_contents(ROOT . 'template/web.template.html');
	$tpl = str_replace('{{TYPE}}', 'full', $tpl);
	$tpl = str_replace('{{GAME_CODE}}', $compiled_js, $tpl);
	$tpl = str_replace('{{VERSION}}', $version, $tpl);
	$tpl = str_replace(
		'{{AD_LEADERBOARD}}',
		file_get_contents(ROOT . 'template/ad_leaderboard.html'),
		$tpl
	);
	/*
	// DEMO
	$demo_js = file_get_contents(ROOT . 'horde_demo.js');
	$demo_tpl = file_get_contents(ROOT . 'template/web.template.html');
	$demo_tpl = str_replace('{{TYPE}}', 'demo', $demo_tpl);
	$demo_tpl = str_replace('{{GAME_CODE}}', $demo_js, $demo_tpl);
	$demo_tpl = str_replace('{{VERSION}}', $version, $demo_tpl);
	$demo_tpl = str_replace(
		'{{AD_LEADERBOARD}}',
		file_get_contents(ROOT . 'template/ad_leaderboard.html'),
		$demo_tpl
	);
	*/
	// SHARED
	$web_root = ROOT . 'build/web/';
	$htdocs = ROOT . 'htdocs';
	exec("mkdir {$web_root}");
	file_put_contents("{$web_root}index.html", $tpl);
	//file_put_contents("{$web_root}demo.html", $demo_tpl);
	exec("cp -r {$htdocs}/img {$web_root}");
	exec("cp -r {$htdocs}/css {$web_root}");
	exec("cp -r {$htdocs}/font {$web_root}");
	exec("cp -r {$htdocs}/sound {$web_root}");
	exec("cp -r {$htdocs}/robots.txt {$web_root}");
	exec("pngcrush -reduce -d {$web_root}img {$htdocs}/img/*.png");
}

// Build the Chrome Web Store app
function buildChromeApp ($version) {
	$app_root = ROOT . 'chrome_web_store/app/';
	$manifest_file = "{$app_root}manifest.json";
	$manifest = json_decode(file_get_contents($manifest_file));
	$manifest->version = $version;
	$json = json_encode($manifest);
	$json = str_replace('\\/', '/', $json);
	$build_root = ROOT . 'build/chrome';
	mkdir($build_root);
	$build_root .= '/unpacked';
	mkdir($build_root);
	exec("cp -r {$app_root}icons {$build_root}/");
	file_put_contents("{$build_root}/manifest.json", $json);
	$compiled_js = file_get_contents(ROOT . 'horde.js');
	$tpl = file_get_contents(ROOT . 'template/chrome.template.html');
	$tpl = str_replace('{{GAME_CODE}}', $compiled_js, $tpl);
	$tpl = str_replace('{{VERSION}}', $version, $tpl);
	$web_root = ROOT . 'build/web';
	mkdir("{$build_root}/htdocs");
	file_put_contents("{$build_root}/htdocs/index.html", $tpl);
	exec("cp -r {$web_root}/css {$web_root}/font {$web_root}/img {$web_root}/sound {$build_root}/htdocs");
	exec("cd {$build_root}; zip -r ../onslaught_arena_{$version}.zip manifest.json icons htdocs");
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
	"{$js_dir}/", // Append wave file to index 8!
	"{$js_dir}/engine.js",
	"{$js_dir}/object.js",
	"{$js_dir}/object_types.js",
	"{$js_dir}/image_loader.js",
	"{$js_dir}/spawn_point.js",
	"{$js_dir}/spawn_wave.js",
	"{$js_dir}/run_game.js"
);

$version = getVersion();
echo "Building Onslaught! Arena v{$version}\n";

$full_version = $source_js;
$full_version[8] .= 'waves_full.js';

echo "Compiling Full Version JavaScript...\n";
compileJS($full_version, ROOT. 'horde.js', $version);

/*
$demo_version = $source_js;
$demo_version[8] .= 'waves_demo.js';

echo "Compiling Demo Version JavaScript...\n";
compileJS($demo_version, ROOT. 'horde_demo.js', $version, true);
*/

setup();

echo "Building web version...\n";
buildWeb($version);

/*
echo "Building Chrome Web Store app...\n";
buildChromeApp($version);
*/

cleanup();

echo "Done!\n";
