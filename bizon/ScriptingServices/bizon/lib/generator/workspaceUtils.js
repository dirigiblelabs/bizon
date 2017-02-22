/* globals $ */
/* eslint-env node, dirigible */

var workspaces = require('platform/workspaces');
var streams = require('io/streams');

exports.create = function(parameters) {
	var project = createProject(parameters);
	var rootFolder = createRootFolder(project, parameters);
	var packageFolder = createPackageFolder(rootFolder, parameters);
	var folder = createPackageSubFolders(packageFolder, parameters);
	createFile(folder, parameters);
};

function createProject(parameters) {
	// Get the logged-in user's workspace
	var workspace = workspaces.getWorkspace();
	var workspaceRoot = workspace.getRoot();

	var project = workspaceRoot.getProject(parameters.projectName);
	if (!project.exists()) {
		project.create();
	}
	return project;
}

function createRootFolder(project, parameters) {
	var rootFolder = project.getFolder(parameters.rootFolder);
	if (!rootFolder.exists()) {
		rootFolder.create();
	}
	return rootFolder;
}

function createPackageFolder(rootFolder, parameters) {
	var packageFolder = rootFolder.getFolder(parameters.packageName);
	if (!packageFolder.exists()) {
		packageFolder.create();
	}
	return packageFolder;
}

function createPackageSubFolders(packageFolder, parameters) {
	var currentFolder = packageFolder;
	var packageFolders = getPackageFolders(parameters.packagePath);
	
	for (var i = 0 ; i < packageFolders.length; i ++) {
		var folder = currentFolder.getFolder(packageFolders[i]);
		if (!folder.exists()) {
			folder.create();
		}
		currentFolder = folder;
	}
	return currentFolder;
}

function createFile(folder, parameters) {
	var file = folder.getFile(parameters.fileName);
	if (!file.exists()) {
		var bytes = streams.textToByteArray(parameters.fileContent);
		file.create(streams.createByteArrayInputStream(bytes));
	}
}

function getPackageFolders(path) {
	return path ? path.split('/') : [];
}
