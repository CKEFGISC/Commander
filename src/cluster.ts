import cluster, { Worker } from "node:cluster";

if (cluster.isPrimary) {
  cluster.fork();

  cluster.on("exit", (worker: Worker, code: number | null, signal: string | null) => {
    if (process.env.SAFE_MODE != "false") {
      console.log("Process stopped, restarting...");
      cluster.fork();
    }
  });
}

if (cluster.isWorker) {
  require("dist/index");
}
