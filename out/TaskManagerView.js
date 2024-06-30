const vscode = require('vscode');
const TaskDataProvider = require('./TaskDataProvider');

class TaskManagerView {
  constructor(context, taskDataProvider) {
    this._context = context;
    this._taskDataProvider = taskDataProvider || new TaskDataProvider();
    this._view = vscode.window.createTreeView('taskList', {
      treeDataProvider: this._taskDataProvider
    });
    console.log('TaskManagerView: view created with taskDataProvider', this._taskDataProvider);
  }

  show() {
    console.log('TaskManagerView: show called');
    this._view.reveal(this._taskDataProvider.tasks[0]); // Adjust as per your requirement
  }

  dispose() {
    console.log('TaskManagerView: dispose called');
    this._view.dispose();
  }
}

module.exports = TaskManagerView;
