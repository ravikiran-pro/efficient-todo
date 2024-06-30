const vscode = require('vscode');
const TaskManagerView = require('./TaskManagerView');
const TaskDataProvider = require('./TaskDataProvider');
const cron = require('node-cron');

let taskManagerView;
let taskDataProvider;
let statusBarItem;
let currentTaskLabel;
let taskTimers = {};

function activate(context) {
  console.log('Congratulations, your extension "my-task-manager-extension" is now active!');

  // Create instances of TaskDataProvider and TaskManagerView
  taskDataProvider = new TaskDataProvider();
  taskManagerView = new TaskManagerView(context, taskDataProvider);

  // Register Task Manager view in sidebar
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('taskManager', taskDataProvider)
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('efficient-todo.showTaskManager', () => {
      taskManagerView.show();
    }),

    vscode.commands.registerCommand('efficient-todo.addTask', async () => {
      console.log('extensionMain: addTask command called');

      // Show input box to get task label from user
      const taskLabel = await vscode.window.showInputBox({
        prompt: 'Enter task label',
        placeHolder: 'Task label'
      });

      if (taskLabel) {
        // Add task to data provider
        const newTask = { label: taskLabel, time: '00:00', running: false }; // Example structure
        taskDataProvider.tasks.push(newTask);
        taskDataProvider.refresh(); // Refresh the tree data to reflect the new task
        vscode.window.showInformationMessage(`Task "${taskLabel}" added successfully.`);
      } else {
        vscode.window.showInformationMessage('Task addition cancelled.');
      }
    }),

    vscode.commands.registerCommand('efficient-todo.startTask', (task) => {
      startTaskTimer(task);
    }),

    vscode.commands.registerCommand('efficient-todo.stopTask', () => {
      stopTaskTimer();
    }),
    
    vscode.commands.registerCommand('efficient-todo.removeTask', (task) => {
      removeTask(task);
    }),

  );

  // Initialize status bar item for task timer
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  context.subscriptions.push(statusBarItem);

  console.log('extensionMain: register tasks');
}

function removeTask(task) {
  if(currentTaskLabel){
    taskTimers[currentTaskLabel].stop();
    delete taskTimers[currentTaskLabel];
    taskDataProvider.removeTask(currentTaskLabel);
    statusBarItem.hide();
  }else{
    taskDataProvider.removeTask(task.label);
  }
  currentTaskLabel = null;
}

function deactivate() {
  // Clean up resources when extension is deactivated
  taskManagerView.dispose();
  statusBarItem.dispose();
  Object.values(taskTimers).forEach(timer => timer.destroy());
}

function startTaskTimer(task) {
  const taskLabel = task.label;
  
  if (currentTaskLabel && currentTaskLabel !== taskLabel) {
    vscode.window.showInformationMessage(`Task "${currentTaskLabel}" is already running. Stop it before starting "${taskLabel}".`);
    return;
  }

  if (taskTimers[taskLabel]) {
    vscode.window.showInformationMessage(`Task "${taskLabel}" is already running.`);
    return;
  }

  // Fetch previous elapsed seconds from data provider
  let seconds = getElapsedSeconds(task?.time || 0)

  statusBarItem.text = `${taskLabel} - ${formatTime(seconds)}`;
  statusBarItem.show();
  statusBarItem.command = {
    command: 'efficient-todo.stopTask',
    title: 'Stop Task',
    arguments: [task]
  };

  taskTimers[taskLabel] = cron.schedule('* * * * * *', () => {
    seconds++;
    const formattedTime = formatTime(seconds);
    statusBarItem.text = `${taskLabel} - ${formattedTime}`;
    taskDataProvider.updateTaskTime(taskLabel, formattedTime);
  });

  taskDataProvider.setTaskRunning(taskLabel, true);
  currentTaskLabel = taskLabel;
}

// Helper function to convert formatted time (mm:ss) or seconds to seconds
function getElapsedSeconds(formattedTime) {
  if (!formattedTime) {
    return 0;
  }

  if (formattedTime.includes(':')) {
    // Handle mm:ss format
    const [minutes, seconds] = formattedTime.split(':').map(num => parseInt(num, 10));
    return minutes * 60 + seconds;
  } else {
    // Handle seconds format
    return parseInt(formattedTime, 10);
  }
}

function stopTaskTimer() {
  if (!currentTaskLabel || !taskTimers[currentTaskLabel]) {
    vscode.window.showInformationMessage('No task timer is currently running.');
    return;
  }

  taskTimers[currentTaskLabel].stop();
  delete taskTimers[currentTaskLabel];
  taskDataProvider.setTaskRunning(currentTaskLabel, false);
  statusBarItem.hide();
  currentTaskLabel = null;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

module.exports = {
  activate,
  deactivate
};
