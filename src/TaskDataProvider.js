const vscode = require('vscode');

class TaskDataProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.tasks = [
      { label: 'Task 1', time: '00:00', running: false },
      { label: 'Task 2', time: '00:00', running: false },
      { label: 'Task 3', time: '00:00', running: false }
    ]; // Replace with actual task data or fetch dynamically
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element) {
    const treeItem = new vscode.TreeItem(
      `${element.label.padEnd(100 + (6-element?.label?.length))} ${element.time}`, // Adjust padding as needed for alignment
      vscode.TreeItemCollapsibleState.None
    );
    // Set context value based on the running state
    treeItem.contextValue = element.running ? 'running' : 'stopped';

    // Set command for the tree item
    treeItem.command = {
      command: 'efficient-todo.startTask', // Command to be invoked on click
      title: 'Start Task', // Title displayed on hover
      arguments: [element] // Arguments to pass to the command function
    };

    // Set context menu for the tree item
    treeItem.contextMenu = [
      {
        command: 'efficient-todo.removeTask',
        title: 'Remove',
        arguments: [element]
      }
    ];

    return treeItem;
  }

  getChildren() {
    return this.tasks;
  }

  updateTaskTime(taskLabel, time) {
    const task = this.tasks.find(t => t.label === taskLabel);
    if (task) {
      task.time = time;
      this.refresh();
    }
  }

  removeTask(taskLabel) {
    const index = this.tasks.findIndex(t => t.label === taskLabel);
    if (index !== -1) {
        this.tasks.splice(index, 1);
        this.refresh();
    }
}

  setTaskRunning(taskLabel, running) {
    const task = this.tasks.find(t => t.label === taskLabel);
    if (task) {
      task.running = running;
      this.refresh();
    }
  }

  getElapsedSeconds(label) {
    const task = this.tasks.find(task => task.label === label);
    return task ? task.time : 0;
  }
}

module.exports = TaskDataProvider;
