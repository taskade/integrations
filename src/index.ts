import 'cross-fetch/polyfill';

import { version as platformVersion } from 'zapier-platform-core';

import { authentication } from './authentication';
import AddAgentKnowledge from './creates/addAgentKnowledge';
import AssignTask from './creates/assignTask';
import CompleteProject from './creates/completeProject';
import CompleteTask from './creates/completeTask';
import CopyProject from './creates/copyProject';
import CreateAgent from './creates/createAgent';
import CreateProject from './creates/createProject';
import CreateProjectFromTemplate from './creates/createProjectFromTemplate';
import CreateTask from './creates/createTask';
import CustomApiCall from './creates/customApiCall';
import DeleteTask from './creates/deleteTask';
import EnableShareLink from './creates/enableShareLink';
import GenerateAgent from './creates/generateAgent';
import MoveTask from './creates/moveTask';
import PublishAgent from './creates/publishAgent';
import RunAgent from './creates/runAgent';
import SetCustomField from './creates/setCustomField';
import SetTaskDate from './creates/setTaskDate';
import SetTaskNote from './creates/setTaskNote';
import TriggerAutomation from './creates/triggerAutomation';
import UpdateAgent from './creates/updateAgent';
import UpdateTask from './creates/updateTask';
import FindProject from './searches/findProject';
import FindTask from './searches/findTask';
import GetAllAgents from './triggers/getAllAgents';
import GetAllAssignableMembers from './triggers/getAllAssignableMembers';
import GetAllBlocks from './triggers/getAllBlocks';
import GetAllFields from './triggers/getAllFields';
import GetAllProjects from './triggers/getAllProjects';
import GetAllProjectTemplates from './triggers/getAllProjectTemplates';
import GetAllSpaces from './triggers/getAllSpaces';
import GetAllTasks from './triggers/getAllTasks';
import {
  NewComment,
  NewProject,
  ProjectAssigned,
  ProjectJoined,
  TaskAssigned,
} from './triggers/publicWebhook';
import TaskDue from './triggers/taskDue';

const { version } = require('../package.json');

export default {
  version,
  platformVersion,
  authentication,

  triggers: {
    // hidden dropdown helpers
    [GetAllBlocks.key]: GetAllBlocks,
    [GetAllProjects.key]: GetAllProjects,
    [GetAllSpaces.key]: GetAllSpaces,
    [GetAllAssignableMembers.key]: GetAllAssignableMembers,
    [GetAllTasks.key]: GetAllTasks,
    [GetAllProjectTemplates.key]: GetAllProjectTemplates,
    [GetAllAgents.key]: GetAllAgents,
    [GetAllFields.key]: GetAllFields,
    // instant triggers
    [TaskDue.key]: TaskDue,
    [NewComment.key]: NewComment,
    [TaskAssigned.key]: TaskAssigned,
    [NewProject.key]: NewProject,
    [ProjectAssigned.key]: ProjectAssigned,
    [ProjectJoined.key]: ProjectJoined,
  },

  creates: {
    // tasks
    [CreateTask.key]: CreateTask,
    [CompleteTask.key]: CompleteTask,
    [UpdateTask.key]: UpdateTask,
    [DeleteTask.key]: DeleteTask,
    [MoveTask.key]: MoveTask,
    [SetTaskDate.key]: SetTaskDate,
    [AssignTask.key]: AssignTask,
    [SetTaskNote.key]: SetTaskNote,
    [SetCustomField.key]: SetCustomField,
    // projects
    [CreateProject.key]: CreateProject,
    [CreateProjectFromTemplate.key]: CreateProjectFromTemplate,
    [CompleteProject.key]: CompleteProject,
    [CopyProject.key]: CopyProject,
    [EnableShareLink.key]: EnableShareLink,
    // AI agents
    [RunAgent.key]: RunAgent,
    [CreateAgent.key]: CreateAgent,
    [GenerateAgent.key]: GenerateAgent,
    [UpdateAgent.key]: UpdateAgent,
    [AddAgentKnowledge.key]: AddAgentKnowledge,
    [PublishAgent.key]: PublishAgent,
    // automations + escape hatch
    [TriggerAutomation.key]: TriggerAutomation,
    [CustomApiCall.key]: CustomApiCall,
  },

  searches: {
    [FindTask.key]: FindTask,
    [FindProject.key]: FindProject,
  },
};
