import 'cross-fetch/polyfill';

import { version as platformVersion } from 'zapier-platform-core';

import { authentication } from './authentication';
import CompleteTask from './creates/completeTask';
import CreateProject from './creates/createProject';
import CreateProjectFromTemplate from './creates/createProjectFromTemplate';
import CreateTask from './creates/createTask';
import CustomApiCall from './creates/customApiCall';
import DeleteTask from './creates/deleteTask';
import MoveTask from './creates/moveTask';
import RunAgent from './creates/runAgent';
import UpdateTask from './creates/updateTask';
import FindProject from './searches/findProject';
import FindTask from './searches/findTask';
import GetAllAssignableMembers from './triggers/getAllAssignableMembers';
import GetAllBlocks from './triggers/getAllBlocks';
import GetAllProjects from './triggers/getAllProjects';
import GetAllProjectTemplates from './triggers/getAllProjectTemplates';
import GetAllSpaces from './triggers/getAllSpaces';
import GetAllTasks from './triggers/getAllTasks';
import TaskDue from './triggers/taskDue';

const { version } = require('../package.json');

export default {
  version,
  platformVersion,
  authentication,

  triggers: {
    [GetAllBlocks.key]: GetAllBlocks,
    [GetAllProjects.key]: GetAllProjects,
    [GetAllSpaces.key]: GetAllSpaces,
    [GetAllAssignableMembers.key]: GetAllAssignableMembers,
    [GetAllTasks.key]: GetAllTasks,
    [GetAllProjectTemplates.key]: GetAllProjectTemplates,
    [TaskDue.key]: TaskDue,
  },

  creates: {
    [CreateTask.key]: CreateTask,
    [CompleteTask.key]: CompleteTask,
    [UpdateTask.key]: UpdateTask,
    [DeleteTask.key]: DeleteTask,
    [MoveTask.key]: MoveTask,
    [CreateProject.key]: CreateProject,
    [CreateProjectFromTemplate.key]: CreateProjectFromTemplate,
    [RunAgent.key]: RunAgent,
    [CustomApiCall.key]: CustomApiCall,
  },

  searches: {
    [FindTask.key]: FindTask,
    [FindProject.key]: FindProject,
  },
};
