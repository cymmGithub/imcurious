The video features Jake Archibald explaining the web browser event loop, detailing how it coordinates JavaScript execution, rendering, and various task queues to ensure a deterministic and smooth user experience.
The Main Thread and the Event Loop
The browser's "main thread" is where the bulk of web activity occurs, including JavaScript execution, rendering, and the DOM￼
1
￼
2
. Because these processes share a single thread, they cannot happen simultaneously. The event loop acts as an orchestrator, spinning constantly to decide which piece of work gets to run next￼
3
￼
4
.
If a task on the main thread takes too long (e.g., over 200ms), it "blocks" everything else, including user interaction and rendering￼
2
￼
5
. Archibald compares this to a human sneezing, where all other bodily functions momentarily shut down￼
6
.
Task Queues
Tasks (sometimes called macrotasks) are used for events like setTimouts, mouse clicks, network responses, and message passing￼
4
￼
7
.
Execution Logic: When a task is queued, the event loop takes a "detour" to run it￼
8
.
One-at-a-time Rule: The event loop processes only one task before moving back to its main rotation. If multiple tasks are queued (like two setTimeout callbacks), it will complete one, go around the loop, and then pick up the next￼
9
￼
more_horiz
.
Non-Blocking Loops: Because tasks allow the loop to return to its main rotation between executions, a loop created with setTimeout will not block rendering, whereas a while(true) loop will block the thread forever￼
10
￼
12
.
The Render Steps and requestAnimationFrame
The render steps include style calculation, layout, and painting￼
13
.
Timing: Rendering usually occurs at the frequency of the display, commonly 60 times a second (60Hz)￼
14
. The browser is efficient; if nothing has changed or the tab is in the background, it will skip the render steps￼
15
.
requestAnimationFrame (RAF): This API allows code to run specifically within the render steps detour￼
16
.
Technical Advantage: Unlike setTimeout, which can run too often (wasting CPU) or "drift" and cause visual jank, RAF is synchronized with the display's refresh rate￼
17
￼
more_horiz
.
Caveats: While the spec dictates RAF should happen before style calculation and paint, Edge and Safari incorrectly place it after the paint step, which can cause delays in visual updates￼
20
￼
more_horiz
.
Microtasks
Microtasks were originally created for Mutation Observers but are now most commonly associated with Promises￼
22
￼
more_horiz
.
Execution Logic: Microtasks run whenever the JavaScript stack clears (empties)￼
25
. This can happen at the end of a task or even between event listeners￼
26
.
Run-to-Completion: Unlike the task queue, the event loop will not continue until the microtask queue is completely empty. If you recursively queue microtasks, you will block the event loop and rendering indefinitely￼
27
.
Technical Caveats and Edge Cases
The video highlights several subtle behaviors that can lead to bugs:
CSS Transitions: If you change a style and immediately change it again in the same JavaScript block, the browser only sees the final value￼
28
￼
29
. To force an animation between these values, you typically need two requestAnimationFrame calls to ensure the browser has a chance to calculate the styles in between￼
30
.
User vs. Script Clicks:
User Click: When a user clicks a button, the JavaScript stack empties after each event listener, allowing microtasks to run between listeners￼
26
.
.click() via Script: When calling button.click() in code, the stack is not empty because the script that called it is still running. Consequently, all listeners run first, and all microtasks are deferred until after the entire click process is finished￼
31
￼
32
.
event.preventDefault(): Because Promises (microtasks) run after the synchronous execution of an event listener, you can still call preventDefault() within a Promise callback during a user click, but it will be too late if the click was triggered via script￼
33
￼
more_horiz
.