
import { Server } from "./index.js"

try {
    Server();
  } catch (err) {
    console.error(err);
    process.exit(1); 
  }