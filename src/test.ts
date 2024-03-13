
// Define a type for your async functions
type AsyncFunction = () => Promise<void>;

class AsyncQueue {
  private queue: AsyncFunction[] = [];
  private running = false;

  // Method to add async functions to the queue
  addToQueue(func: AsyncFunction) {
    this.queue.push(func);
    if (!this.running) {
      this.executeQueue();
    }
  }

  // Execute the queue
  private async executeQueue() {
    this.running = true;
    while (this.queue.length > 0) {
      const func = this.queue.shift();
      if (func) {
        await func();
      }
    }
    this.running = false;
  }
}

// Example usage
const asyncQueue = new AsyncQueue();

// Function to simulate an asynchronous task
async function asyncTask(id: number) {
  console.log(`Starting task ${id}`);
  // Simulate asynchronous operation
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
  console.log(`Task ${id} completed`);
}

// Add tasks to the queue
let data = 1;
asyncQueue.addToQueue(() => asyncTask(data));
data = 2;
asyncQueue.addToQueue(() => asyncTask(data));
data = 3;
asyncQueue.addToQueue(() => asyncTask(data));
