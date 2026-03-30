import type { SyncFrameOp, TaskType } from './simulation'

type AsyncStep = {
  type: TaskType
  delay?: number
}

export type Scenario = {
  id: string
  code: string
  syncOps?: SyncFrameOp[]
  asyncSteps?: AsyncStep[]
}

export const SCENARIOS: Record<string, Scenario> = {
  'sync-callstack': {
    id: 'sync-callstack',
    code: `function greet(name) {
  return \`Hello, \${name}!\`;
}

function welcome() {
  const message = greet("world");
  console.log(message);
}

welcome();`,
    syncOps: [
      { action: 'push', name: 'welcome()', line: 9 },
      { action: 'push', name: 'greet("world")', line: 5 },
      { action: 'pop', line: 1 },
      { action: 'push', name: 'console.log()', line: 6 },
      { action: 'pop', line: 6 },
      { action: 'pop', line: 9 },
    ],
  },

  'webapi-settimeout': {
    id: 'webapi-settimeout',
    code: `console.log("Start");

setTimeout(() => {
  console.log("Timer done");
}, 1000);

console.log("End");`,
    syncOps: [
      { action: 'push', name: 'console.log("Start")', line: 0 },
      { action: 'pop', line: 0 },
      { action: 'push', name: 'setTimeout()', line: 2, asyncEffect: { type: 'setTimeout', delay: 1000 } },
      { action: 'pop', line: 4 },
      { action: 'push', name: 'console.log("End")', line: 6 },
      { action: 'pop', line: 6 },
    ],
    asyncSteps: [{ type: 'setTimeout', delay: 1000 }],
  },

  'task-queue-ordering': {
    id: 'task-queue-ordering',
    code: `setTimeout(() => console.log("A"), 0);
setTimeout(() => console.log("B"), 0);
console.log("C");`,
    syncOps: [
      { action: 'push', name: 'setTimeout(A)', line: 0, asyncEffect: { type: 'setTimeout', delay: 0 } },
      { action: 'pop', line: 0 },
      { action: 'push', name: 'setTimeout(B)', line: 1, asyncEffect: { type: 'setTimeout', delay: 0 } },
      { action: 'pop', line: 1 },
      { action: 'push', name: 'console.log("C")', line: 2 },
      { action: 'pop', line: 2 },
    ],
    asyncSteps: [
      { type: 'setTimeout', delay: 0 },
      { type: 'setTimeout', delay: 0 },
    ],
  },

  'microtask-priority': {
    id: 'microtask-priority',
    code: `setTimeout(() => console.log("Task"), 0);

fetch("/api/starwars")
  .then(res => res.json())
  .then(data => console.log(data.name));

console.log("Sync");`,
    syncOps: [
      { action: 'push', name: 'setTimeout()', line: 0, asyncEffect: { type: 'setTimeout', delay: 0 } },
      { action: 'pop', line: 0 },
      { action: 'push', name: 'fetch()', line: 2, asyncEffect: { type: 'fetch' } },
      { action: 'pop', line: 4 },
      { action: 'push', name: 'console.log("Sync")', line: 6 },
      { action: 'pop', line: 6 },
    ],
    asyncSteps: [
      { type: 'setTimeout', delay: 0 },
      { type: 'fetch' },
    ],
  },

  'render-step': {
    id: 'render-step',
    code: `requestAnimationFrame(() => {
  document.body.style.background = "blue";
});

setTimeout(() => console.log("Task"), 0);

fetch("/api/starwars")
  .then(res => console.log(res.json()));`,
    syncOps: [
      { action: 'push', name: '🎨 rAF()', line: 0, asyncEffect: { type: 'rAF' } },
      { action: 'pop', line: 2 },
      { action: 'push', name: 'setTimeout()', line: 4, asyncEffect: { type: 'setTimeout', delay: 0 } },
      { action: 'pop', line: 4 },
      { action: 'push', name: 'fetch()', line: 6, asyncEffect: { type: 'fetch' } },
      { action: 'pop', line: 7 },
    ],
    asyncSteps: [
      { type: 'setTimeout', delay: 0 },
      { type: 'fetch' },
    ],
  },
}
