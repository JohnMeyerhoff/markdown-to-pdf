#!/usr/bin/env node
'use strict';

const fs = require("fs");
const path = require("path");
const md2pdf = require('./markdown-to-pdf');


const DEFAULT_THEME_FILE = '/markdown-to-pdf/styles/markdown.css';
const DEFAULT_HIGHLIGHT_FILE = '/markdown-to-pdf/styles/highlight.css';
const DEFAULT_TEMPLATE_FILE = '/markdown-to-pdf/template/template.html';


// CreateOutputDirectory creates the output directory if it doesn't exist
function CreateOutputDirectory(dirname) {
	if(!fs.existsSync(dirname)) {
		fs.mkdirSync(dirname);
	}
}

// GetMarkdownFiles returns an array of only files ending in .md or .markdown
// NOTE: When a file name is the same, eg. happy.md and happy.markdown, only one file is
// outputted as it will be overwritten. This needs to be checked. (TODO:)
function GetMarkdownFiles(files) {
	return files.filter(function(filePath) {
		if(path.extname(filePath).match(/^(.md|.markdown)$/)) {
			return true;
		}
	});
}

// UpdateFileName is a helper function to replace the extension
function UpdateFileName(fileName, extension) {
	fileName = fileName.split('.');
	fileName.pop();
	
	if(extension !== null) fileName.push(extension);
	
	return fileName.join('.');
}


function execute(env_prefix = '', root_dir = '/') {
	function getEnv(name, def, transformer = val => val) {
		let value = process.env[env_prefix + name.toUpperCase()];
		
		return (value === undefined || value === '') ? def : transformer(value);
	}
	
	function pathTransformer(file) {
		file = path.normalize(root_dir + file);
		
		if(!file.startsWith(root_dir)) throw `Cannot move outside of directory '${root_dir}'`;
		
		return file;
	}
	
	function dirTransformer(file) {
		if(file[-1] !== '/') file += '/';
		
		return pathTransformer(file);
	}
	
	function booleanTransformer(bool) {
		return bool === 'true';
	}
	
	
	// GitHub Action inputs that are needed for this program to run
	const InputDir = getEnv('input_dir', '', dirTransformer);
	const ImageImport = getEnv('image_import', null);
	const ImageDir = getEnv('images_dir', InputDir + md2pdf.nullCoalescing(ImageImport, ''), dirTransformer);
	
	// Optional input, though recommended
	const OutputDir = getEnv('output_dir', 'built/', dirTransformer);
	
	// Whether to also output a <filename>.html file, there is a bit of magic at the end to ensure that the value is a boolean
	const build_html = getEnv('build_html', true, booleanTransformer);
	
	// Custom CSS and HTML files for theming
	const ThemeFile = getEnv('theme', DEFAULT_THEME_FILE, pathTransformer);
	const HighlightThemeFile = getEnv('highlight_theme', DEFAULT_HIGHLIGHT_FILE, pathTransformer);
	const TemplateFile = getEnv('template', DEFAULT_TEMPLATE_FILE, pathTransformer);
	
	// Whether to extend your custom CSS file with the default theme
	const extend_default_theme = getEnv('extend_default_theme', false, booleanTransformer);
	// Whether to extend your custom CSS file with the default highlight theme
	const extend_highlight_theme = getEnv('extend_highlight_theme', false, booleanTransformer);
	
	// Table Of Contents settings
	const table_of_contents = getEnv('table_of_contents', false, booleanTransformer);
	
	
	// GetFileBody retrieves the file content as a string
	function GetFileBody(file) {
		return md2pdf.getFileContent(InputDir + file);
	}
	
	// BuildHTML outputs the HTML string to a file
	function BuildHTML(result, file) {
		file = UpdateFileName(file, 'html');
		
		result.writeHTML(OutputDir + file);
		
		console.log('Built HTML file: ' + file);
	}
	
	// BuildPDF outputs the PDF file after building it via a chromium package
	function BuildPDF(result, file) {
		file = UpdateFileName(file, 'pdf');
		
		result.writePDF(OutputDir + file);
		
		console.log('Built PDF file: ' + file);
		console.log();
	}
	
	
	console.log('Detected settings:');
	console.table({
		input_dir: InputDir,
		image_import: ImageImport,
		image_dir: ImageDir,
		
		output_dir: OutputDir,
		
		build_html: build_html,
		
		theme: ThemeFile,
		highlight_theme: HighlightThemeFile,
		template: TemplateFile,
		
		extend_default_theme: extend_default_theme,
		extend_highlight_theme: extend_highlight_theme,
		
		table_of_contents: table_of_contents,
	});
	console.log();
	console.log();
	
	// Assign the style and template files to strings for later manipulation
	const style = (extend_default_theme ? md2pdf.getFileContent(DEFAULT_THEME_FILE) : '')
		+ md2pdf.getFileContent(ThemeFile)
		+ (extend_highlight_theme ? md2pdf.getFileContent(DEFAULT_HIGHLIGHT_FILE) : '')
		+ md2pdf.getFileContent(HighlightThemeFile);
	const template = md2pdf.getFileContent(TemplateFile);
	
	let md = new md2pdf({
		image_import: ImageImport,
		image_dir: ImageDir,
		
		style: style,
		template: template,
		
		table_of_contents: table_of_contents,
	});
	md.start();
	fs.readdir(InputDir, async function(err, files) {
		// Check output folder exists and fetch file array
		CreateOutputDirectory(OutputDir);
		
		files = GetMarkdownFiles(md2pdf.nullCoalescing(files, []));
		if(files.length === 0) throw 'No markdown files found! Exiting.';
		
		console.log('Markdown files found: ' + files.join(', '));
		console.log();
		console.log();
		
		// Loop through each file converting it
		for(let file of files) {
			// Get the content of the MD file and convert it
			let result = await md.convert(GetFileBody(file), UpdateFileName(file, null));
			
			// If the `build_html` environment variable is true, build the HTML
			if(build_html === true) {
				BuildHTML(result, file);
			}
			
			// Build the PDF file
			BuildPDF(result, file);
		}
		
		// Close the image server
		md.close();
	});
}

exports = module.exports = execute;
