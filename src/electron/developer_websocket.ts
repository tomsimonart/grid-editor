import WebSocket from "ws";
import { store } from "./main-store";

export const developerWebsocket = {
  mainWindow: undefined,
};

let wss;
let interval;

startWebsocketServer(store.get("wssDeveloperPort") || 9000);

function startWebsocketServer(port) {
  wss = new WebSocket.Server({ port: port });

  wss.on("error", (error) =>
    console.log("The server encountered an error!", error)
  );

  wss.on("connection", function (ws) {
    console.info("WS Developer Client connected!");
    ws.on("message", function message(data) {
        console.log("WS DEVELOPER message:", {data});
    });

    ws.on("close", function () {
      console.warn("WS Client disconnected!");
    });
  });
}