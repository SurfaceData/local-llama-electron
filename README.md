# Local Llama Electron

This is a simple demo app that embeds
[node-llama-cpp](https://withcatai.github.io/node-llama-cpp/) into an
[Electron.js](https://www.electronjs.org/).  Think of this as a basic skeleton
for how you can create your own version of [LM Studio](https://lmstudio.ai/),
but without having to go through some javascript compiler pain.

## Key details

This is built using [Electron Forge](https://www.electronforge.io/) which is
usually a great way to get an Electron app up and running.  However, we have to
do a few magic tricks due to requirements fro `node-llama-cpp`:
* First, we have to use Electron v28 which is in beta so that the whole project
  can use EcmaScript Modules instead of Common JS.  That's done in the project
dependencies.
* Next, since we want to make life easier with React.JS, we have to get Vite
  working right.  Electron doesn't fully support ESM in their vite plugin, so I
forked it
[here](https://github.com/fozziethebeat/electron-forge-plugin-vite-esm).  This
is also included in the dependencies.
* Finally, make sure we leave `node-llama-cpp` as an external dependency
  instead of trying to compile it.

In a follow up blog post, I'll explain all these steps in depth since they were
honestly a huge pain.